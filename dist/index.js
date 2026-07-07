import { jsx } from 'react/jsx-runtime';
import { useObserver } from 'keck/react';
import { createContext, useContext, useRef, Fragment, useMemo } from 'react';
import { unwrap, atomic, derive, shallowCompare, registerObservableClass, observe, focus, deep, transformInPlace, peek } from 'keck';
import { cloneDeepWith, get as get$1, set, isEqual, unset, isEmpty } from 'lodash-es';

const keckFormContext = createContext(null);
function useFormContext(dontThrowOnMissingProvider = false) {
    const form = useContext(keckFormContext);
    if (!form) {
        if (!dontThrowOnMissingProvider)
            throw new Error('useFormContext must be used within a FormProvider.');
        return null;
    }
    // NOTE: It is an invariant error (i.e. a developer mistake) to change the value of `throwOnMissingProvider` or
    // whether this hook is called from inside a FormProvider at runtime, because it changes the number of hooks that
    // are called.
    // biome-ignore lint/correctness/useHookAtTopLevel: hook is called unconditionally at runtime — the early return only fires on invariant violations (wrong provider usage), which are developer mistakes that are caught at startup
    return useObserver(form);
}

/**
 * Provides an existing KeckForm instance to descendant components (`useFormContext` and
 * field-bound inputs).
 *
 * Use this when the form is created outside React — e.g. by a plain factory, store, or
 * controller object that calls `new KeckForm(...)` directly. Forms created with `useForm` don't
 * need this: `useForm` returns its own `FormProvider`, pre-bound to the form it created.
 */
function FormProvider(props) {
    return (jsx(keckFormContext.Provider, { value: props.form, children: props.children }));
}

const $values = Symbol('$values');
const $errors = Symbol('$errors');
const $touched = Symbol('$touched');

/**
 * Deep-clones a form value (initial values in the constructor and reset, and the input passed to
 * the validator).
 *
 * The value itself may be a Keck observable proxy (e.g. initial values read directly from another
 * observable) — it is unwrapped before cloning, mirroring Keck's own assignment semantics (Keck
 * unwraps any observable value written through an observable).
 *
 * Proxies *nested inside plain containers* are an invariant error. Keck guarantees that raw
 * observable state never contains proxies (all write paths unwrap), so a nested proxy can only
 * mean userland built a plain object/array with values read through an observable and handed it
 * to the form (e.g. `setValues({ ...values, field: otherStore.field })`). Silently accepting it
 * would poison the form's raw state: deep traversal of raw values (cloning, equality checks)
 * breaks on proxies, and reads through a foreign proxy register observations on the foreign
 * observer. Fail loudly and tell the caller what to do instead.
 */
function cloneValues(value) {
    return cloneDeepWith(unwrap(value), (nested) => {
        if (unwrap(nested) !== nested) {
            throw new Error('keck-forms: a Keck observable proxy was found nested inside a value being stored in ' +
                'form state. Values read through a Keck observable are proxies; unwrap() them before ' +
                'combining them into plain objects or arrays (e.g. ' +
                'setValues({ ...values, field: unwrap(store.field) })).');
        }
        return undefined; // not a proxy — lodash default cloning
    });
}

function get(obj, path) {
    return !path?.length ? obj : get$1(obj, path);
}

class KeckFieldBase {
    form;
    path;
    constructor(form, path) {
        this.form = form;
        this.path = path;
    }
    get value() {
        return get(this.form[$values], this.path);
    }
    set value(value) {
        // If `value` is itself a Keck observable proxy, Keck's set trap unwraps it on assignment —
        // raw form state never holds proxies. Proxies nested inside a plain container are an
        // invariant error, surfaced by cloneValues() when the form validates (see cloneValues).
        atomic(() => {
            if (this.path) {
                set(this.form[$values], this.path, value);
            }
            else {
                this.form[$values] = value;
            }
        });
    }
    get dirty() {
        // Field is dirty if the value is different from the initial value
        return derive(() => {
            const initialValue = get(this.form.initial, this.path);
            return !isEqual(unwrap(initialValue), unwrap(this.value));
        });
    }
    get touched() {
        return derive(() => {
            if (get(this.form[$touched], this.path))
                return true;
            // work up the path to see if any parent fields have allTouched
            const path = this.path.split('.');
            for (let i = path.length - 1; i >= 0; i--) {
                path.pop();
                // TODO: could be more performant by starting from the top and only descending if object?
                if (get(this.form[$touched], path.join('.')) === true)
                    return true;
            }
            return false;
        });
    }
    set touched(value) {
        /**
         * Setting `touched` on a regular field will simply set the `touched` state on the field itself.
         * If setting to false, the form state's touched tree will be cleaned up from the field to the
         * root, eliminating entries that are empty.
         */
        atomic(() => {
            if (value) {
                if (this.path) {
                    this.form[$touched] ||= {};
                    set(this.form[$touched], this.path, true);
                }
                else
                    this.form[$touched] = true;
            }
            else if (this.path) {
                const path = this.path.split('.');
                unset(this.form[$touched], path);
                while (path.length) {
                    path.pop();
                    const pathValue = get(this.form[$touched], path);
                    if (pathValue !== true &&
                        (isEmpty(pathValue) || (Array.isArray(pathValue) && pathValue.every((p) => isEmpty(p))))) {
                        unset(this.form[$touched], path);
                    }
                    else {
                        break;
                    }
                }
                if (this.form[$touched] !== true && isEmpty(this.form[$touched])) {
                    this.form[$touched] = false;
                }
            }
            else {
                this.form[$touched] = false;
            }
        });
    }
    get errors() {
        return derive(() => this.form[$errors][this.path] || [], shallowCompare);
    }
    get allErrors() {
        return derive(() => this.form[$errors][this.path]
            ? [{ path: this.path, errors: this.form[$errors][this.path] }]
            : [], (a, b) => JSON.stringify(a) === JSON.stringify(b));
    }
    get isValid() {
        return derive(() => this.allErrors.length === 0);
    }
    reset() {
        atomic(() => {
            const value = cloneValues(get(this.form.initial, this.path));
            if (this.path) {
                set(this.form[$values], this.path, value);
            }
            else {
                this.form[$values] = value;
            }
            this.touched = false;
        });
    }
}
class KeckField extends KeckFieldBase {
}

class KeckFieldArray extends KeckFieldBase {
    field(_path) {
        return this.form.field(`${this.path}.${_path}`);
    }
    /**
     * Maps each field in the array to a new value by invoking the callback function.
     */
    map(callback) {
        const array = get(this.form[$values], this.path);
        return array.map((_, i) => callback(this.field(String(i)), i));
    }
    get allErrors() {
        return derive(() => {
            const entries = Object.entries(this.form[$errors]).filter(([key]) => !this.path || key === this.path || key.startsWith(`${this.path}.`));
            return entries.map(([path, errors]) => ({ path, errors }));
        }, (a, b) => JSON.stringify(a) === JSON.stringify(b));
    }
    // Returns the $touched array for this path, or null if none exists.
    _touchedArray() {
        const touchedRoot = this.form[$touched];
        if (!touchedRoot || touchedRoot === true)
            return null;
        const arr = get(touchedRoot, this.path);
        return Array.isArray(arr) ? arr : null;
    }
    // Walks up the touched tree from this.path and unsets nodes that are empty.
    _cleanupTouched() {
        const pathParts = this.path.split('.');
        while (pathParts.length) {
            const val = get(this.form[$touched], pathParts.join('.'));
            if (val !== true &&
                (isEmpty(val) || (Array.isArray(val) && val.every((p) => isEmpty(p))))) {
                unset(this.form[$touched], pathParts);
            }
            else {
                break;
            }
            pathParts.pop();
        }
        if (isEmpty(this.form[$touched])) {
            this.form[$touched] = false;
        }
    }
    push(value) {
        atomic(() => {
            get(this.form[$values], this.path).push(value);
            // New element is untouched by default — no touched state to update.
        });
    }
    pop() {
        return atomic(() => {
            const result = get(this.form[$values], this.path).pop();
            this._touchedArray()?.pop();
            this._cleanupTouched();
            return result;
        });
    }
    remove(index) {
        atomic(() => {
            get(this.form[$values], this.path).splice(index, 1);
            this._touchedArray()?.splice(index, 1);
            this._cleanupTouched();
        });
    }
    shift() {
        return atomic(() => {
            const result = get(this.form[$values], this.path).shift();
            this._touchedArray()?.shift();
            this._cleanupTouched();
            return result;
        });
    }
    unshift(value) {
        atomic(() => {
            get(this.form[$values], this.path).unshift(value);
            this._touchedArray()?.unshift(null);
        });
    }
    swap(indexA, indexB) {
        atomic(() => {
            const array = get(this.form[$values], this.path);
            [array[indexA], array[indexB]] = [array[indexB], array[indexA]];
            const touched = this._touchedArray();
            if (touched) {
                [touched[indexA], touched[indexB]] = [touched[indexB], touched[indexA]];
            }
        });
    }
    insert(index, value) {
        atomic(() => {
            get(this.form[$values], this.path).splice(index, 0, value);
            this._touchedArray()?.splice(index, 0, null);
        });
    }
    clear() {
        atomic(() => {
            get(this.form[$values], this.path).length = 0;
            const touched = this._touchedArray();
            if (touched)
                touched.length = 0;
            this._cleanupTouched();
        });
    }
}

class KeckFieldObject extends KeckFieldBase {
    field(_path) {
        return this.form.field(`${this.path}.${_path}`);
    }
    get allErrors() {
        return derive(() => {
            const entries = Object.entries(this.form[$errors]).filter(([key]) => !this.path || key === this.path || key.startsWith(`${this.path}.`));
            return entries.map(([path, errors]) => ({ path, errors }));
        }, (a, b) => JSON.stringify(a) === JSON.stringify(b));
    }
}

/**
 * Creates a FormValidatorFn from any Standard Schema (https://standardschema.dev) — e.g. a zod
 * (>= 3.24), valibot, or arktype schema. This is what the `schema` form option uses internally.
 *
 * By default the validator's input type is the schema's input type; pass TFormInput explicitly
 * when the form state is intentionally wider than the schema input (the validator passes any
 * value to the schema at runtime, so this is always safe).
 *
 * Async validation is not supported: a schema whose validate function returns a Promise (e.g. a
 * zod schema with async refinements) throws when the form validates.
 */
const standardSchemaValidator = (schema) => {
    return (values, setError) => {
        const result = schema['~standard'].validate(values);
        if (result instanceof Promise) {
            throw new Error('keck-forms: async validation is not supported (the schema returned a Promise)');
        }
        if (!result.issues)
            return result.value;
        for (const issue of result.issues) {
            const path = (issue.path ?? [])
                .map((segment) => String(typeof segment === 'object' && segment !== null ? segment.key : segment))
                .join('.');
            setError(path, issue.message);
        }
        return null;
    };
};

/**
 * Resolves the effective validator from form options: an explicit `validate` function wins;
 * otherwise a provided Standard Schema is wrapped with standardSchemaValidator.
 */
function resolveValidator(options) {
    if (options.validate)
        return options.validate;
    if (options.schema)
        return standardSchemaValidator(options.schema);
    return undefined;
}
const reassignOptions = Symbol('reassignOptions');
/**
 * A KeckForm object represents the entire state of a form.
 */
class KeckForm {
    initial;
    meta;
    [$values];
    [$touched] = null;
    [$errors] = {};
    _output = null;
    _isSubmitting = false;
    _submitCount = 0;
    _submitAttemptCount = 0;
    _submitError = null;
    validator;
    onSubmit;
    onSubmitAttempt;
    /**
     * Creates a KeckForm by providing an initial state and a validation function.
     * @param options The initial state and validation function.
     */
    constructor(options) {
        this.initial = options.initial;
        this.meta = (options.meta ?? {});
        this[$values] = cloneValues(options.initial);
        this.validator = resolveValidator(options);
        this.onSubmit = options.onSubmit;
        this.onSubmitAttempt = options.onSubmitAttempt;
        // Set up a focused deep observation on $values so that any mutation to it
        // (including Set.add, Array.push, etc.) triggers re-validation. Focus mode is
        // required for deep() to be scoped — without it the observer fires on all
        // changes, which would cause an infinite loop when validate() writes _output.
        // The callback calls validate() through the proxy so $errors writes propagate
        // as observable changes.
        let $self;
        $self = observe(this, {
            focusable: true,
            onChange: () => {
                $self.validate();
            },
        });
        const { commit } = focus($self);
        deep($self[$values]);
        commit();
        this.validate();
        // biome-ignore lint/correctness/noConstructorReturn: returns observable proxy so KeckForm is always reactive
        return $self;
    }
    [reassignOptions](options) {
        if (options.onSubmit)
            this.onSubmit = options.onSubmit;
        if (options.onSubmitAttempt)
            this.onSubmitAttempt = options.onSubmitAttempt;
        if (options.validate || options.schema)
            this.validator = resolveValidator(options);
        if (options.initial)
            this.initial = options.initial;
    }
    get output() {
        return this._output;
    }
    get value() {
        return this.field('').value;
    }
    setValues(values) {
        this.field('').value = values;
    }
    validate() {
        return atomic(() => {
            const errors = {};
            const input = cloneValues(this[$values]);
            this._output = this.validator
                ? this.validator(input, (field, error, action = 'push') => {
                    if (!error && error !== '') {
                        delete errors[field];
                        return;
                    }
                    errors[field] ||= [];
                    if (action === 'push')
                        errors[field].push(error);
                    else if (action === 'unshift')
                        errors[field].unshift(error);
                    else
                        errors[field] = [error];
                })
                : input;
            this[$errors] = transformInPlace(this[$errors], errors);
            return unwrap(this._output);
        });
    }
    get isValid() {
        return this.field('').isValid;
    }
    get dirty() {
        return this.field('').dirty;
    }
    get touched() {
        return this.field('').touched;
    }
    set touched(touched) {
        this.field('').touched = touched;
    }
    get errors() {
        return this.field('').errors;
    }
    get allErrors() {
        return this.field('').allErrors;
    }
    /**
     * Resets the form state. You can optionally reset specific parts of the form state:
     * - **values** - Reset the values to the initial values.
     * - **touched** - Reset the touched state to null.
     * - **submit** - Reset the submit count and submit attempt count to 0.
     */
    reset(resetOptions) {
        atomic(() => {
            if (!resetOptions || resetOptions.values === true)
                this[$values] = cloneValues(this.initial);
            if (!resetOptions || resetOptions.touched === true)
                this[$touched] = null;
            if (!resetOptions || resetOptions.submit === true) {
                this._submitCount = 0;
                this._submitAttemptCount = 0;
            }
        });
    }
    /**
     * Returns a KeckField object for the given path. This can be used to access the field value,
     * errors, and other state.
     *
     * By focusing (with Keck's `focus` method) this FormObserver, you can ensure the callback is only called upon
     * changes to specific fields in the form.
     *
     * @param path The path to access.
     */
    field(path) {
        return peek(() => {
            const value = get(this[$values], path);
            // TFormInput could be 'unknown', which KeckFieldArray and KeckFieldObject won't accept.
            // But we know the type, and the field() method return type is explicit, so we can cast values as any to ignore TS errors.
            if (Array.isArray(value))
                return new KeckFieldArray(this, path);
            if (value !== null && typeof value === 'object')
                return new KeckFieldObject(this, path);
            return new KeckField(this, path);
        });
    }
    async _handleSubmit(e) {
        // Prevent default form submission if this is called from a form submit event
        e?.preventDefault?.();
        const output = this.validate();
        try {
            this._isSubmitting = true;
            this._submitAttemptCount++;
            if (output && this.isValid) {
                this._submitCount++;
                await this.onSubmit?.(output, observe(this));
            }
            else {
                await this.onSubmitAttempt?.();
            }
        }
        catch (e) {
            this._submitError = e;
            // Surface the error in addition to storing it -- a throwing onSubmit/onSubmitAttempt
            // handler would otherwise fail completely silently unless the app renders submitError.
            console.error('KeckForm: error thrown from submit handler', e);
        }
        finally {
            this._isSubmitting = false;
        }
    }
    /**
     * Call this function to submit the form.
     *
     * If the form is valid, the onSubmit function will be called and the submitCount field will be incremented.
     *
     * If the form is not valid, the onSubmitAttempt function will be called and the submitAttemptCount field will be incremented.
     */
    handleSubmit = async (e) => {
        const $this = observe(this);
        await $this._handleSubmit(e);
    };
    get isSubmitting() {
        return this._isSubmitting;
    }
    get submitCount() {
        return this._submitCount;
    }
    get submitAttemptCount() {
        return this._submitAttemptCount;
    }
    get submitError() {
        return this._submitError;
    }
}
registerObservableClass(KeckForm);

function useForm(options, deps) {
    const context = useFormContext(true);
    const contextFormReturn = options.tryContext && context
        ? { form: context, FormProvider: Fragment }
        : null;
    const formRef = useRef(contextFormReturn);
    const previousDepsRef = useRef(undefined);
    const depsChanged = !!deps?.length &&
        (!previousDepsRef.current ||
            deps.length !== previousDepsRef.current.length ||
            deps.some((dep, index) => dep !== previousDepsRef.current?.[index]));
    if (depsChanged) {
        previousDepsRef.current = deps;
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: dependency is managed manually
    const initial = useMemo(() => {
        return typeof options.initial === 'function'
            ? options.initial()
            : options.initial;
    }, [typeof options.initial === 'function' ? undefined : options.initial, ...(deps || [])]);
    if (depsChanged || !formRef.current) {
        const form = new KeckForm({
            initial,
            validate: options.validate,
            schema: options.schema,
            onSubmit: options.onSubmit,
            onSubmitAttempt: options.onSubmitAttempt,
            meta: options.meta,
        });
        formRef.current = {
            form,
            FormProvider: ({ children }) => jsx(FormProvider, { form: form, children: children }),
        };
    }
    const form = useObserver(formRef.current.form, [formRef.current.form]);
    form[reassignOptions]({
        validate: options.validate,
        schema: options.schema,
        initial,
        onSubmit: options.onSubmit,
        onSubmitAttempt: options.onSubmitAttempt,
    });
    return {
        form,
        FormProvider: formRef.current.FormProvider,
    };
}

/**
 * Creates a FormValidatorFn from a zod schema. By default the validator's input type is the
 * schema's input type; pass TFormInput explicitly when the form state is intentionally wider than
 * the schema input (the validator safeParses any value at runtime, so this is always safe).
 *
 * @deprecated Use the `schema` form option or `standardSchemaValidator` instead — zod >= 3.24
 * implements the Standard Schema interface, and both provide the same behavior and typing
 * (including the input-widening TFormInput parameter). zodValidator will be removed in
 * keck-forms 4.
 */
const zodValidator = (schema) => {
    return (values, setError) => {
        const result = schema.safeParse(values);
        if (result.success)
            return result.data;
        for (const error of result.error.errors) {
            const path = error.path.join('.');
            setError(path, error.message);
        }
        return null;
    };
};

export { FormProvider, KeckField, KeckFieldArray, KeckFieldObject, KeckForm, standardSchemaValidator, useForm, useFormContext, zodValidator };
//# sourceMappingURL=index.js.map
