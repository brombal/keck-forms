import { atomic, derive, unwrap, shallowCompare, registerObservableClass, transformInPlace, peek, observe } from 'keck';
import { get as get$1, set, isEqual, unset, isEmpty, cloneDeep } from 'lodash-es';
import { jsx } from 'react/jsx-runtime';
import { useObserver } from 'keck/react';
import { createContext, useContext, Fragment, useRef } from 'react';

const $values = Symbol('$values');
const $errors = Symbol('$errors');
const $touched = Symbol('$touched');

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
        atomic(() => {
            if (this.path) {
                set(this.form[$values], this.path, value);
            }
            else {
                this.form[$values] = value;
            }
            this.form.validate();
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
                    if (isEmpty(pathValue) ||
                        (Array.isArray(pathValue) && pathValue.every((p) => isEmpty(p)))) {
                        unset(this.form[$touched], path);
                    }
                    else {
                        break;
                    }
                }
                if (isEmpty(this.form[$touched])) {
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
            ? [{ path: this.path, errors: this.form[$errors][this.path] || [] }]
            : [], (a, b) => JSON.stringify(a) === JSON.stringify(b));
    }
    get isValid() {
        return derive(() => this.allErrors.length === 0);
    }
    reset() {
        atomic(() => {
            const value = cloneDeep(get(this.form.initial, this.path));
            if (this.path) {
                set(this.form[$values], this.path, value);
            }
            else {
                this.form[$values] = value;
            }
            this.touched = false;
            this.form.validate();
        });
    }
}
class KeckField extends KeckFieldBase {
}

class KeckFieldArray extends KeckFieldBase {
    /**
     * Maps each field in the array to a new value by invoking the callback function.
     */
    map(_callback) {
        return [];
    }
    get allErrors() {
        return derive(() => {
            const entries = Object.entries(this.form[$errors]).filter(([key]) => key.startsWith(this.path));
            return entries.map(([path, errors]) => ({ path, errors }));
        }, (a, b) => JSON.stringify(a) === JSON.stringify(b));
    }
}

class KeckFieldObject extends KeckFieldBase {
    field(_path) {
        return this.form.field(`${this.path}.${_path}`);
    }
    get allErrors() {
        return derive(() => {
            const entries = Object.entries(this.form[$errors]).filter(([key]) => key.startsWith(this.path));
            return entries.map(([path, errors]) => ({ path, errors }));
        }, (a, b) => JSON.stringify(a) === JSON.stringify(b));
    }
}

const reassignOptions = Symbol('reassignOptions');
/**
 * A KeckForm object represents the entire state of a form.
 */
class KeckForm {
    initial;
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
        this[$values] = cloneDeep(options.initial);
        this.validator = options.validate;
        this.onSubmit = options.onSubmit;
        this.onSubmitAttempt = options.onSubmitAttempt;
        this.validate();
    }
    [reassignOptions](options) {
        if (options.onSubmit)
            this.onSubmit = options.onSubmit;
        if (options.onSubmitAttempt)
            this.onSubmitAttempt = options.onSubmitAttempt;
        if (options.validate)
            this.validator = options.validate;
        if (options.initial)
            this.initial = options.initial;
    }
    get output() {
        return this._output;
    }
    get value() {
        return this.field('').value;
    }
    validate() {
        return atomic(() => {
            const errors = {};
            const input = cloneDeep(unwrap(this[$values]));
            this._output = this.validator
                ? this.validator(input, (field, error, action = 'push') => {
                    if (!error) {
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
                this[$values] = cloneDeep(unwrap(this.initial));
            if (!resetOptions || resetOptions.touched === true)
                this[$touched] = null;
            if (!resetOptions || resetOptions.submit === true) {
                this._submitCount = 0;
                this._submitAttemptCount = 0;
            }
            this.validate();
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
            if (typeof value === 'object')
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
                await this.onSubmit?.(output);
            }
            else {
                await this.onSubmitAttempt?.();
            }
        }
        catch (e) {
            this._submitError = e;
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
    return useObserver(form);
}

function useForm(options, deps) {
    const context = useFormContext(true);
    const contextFormReturn = options.tryContext && context ? { form: context, FormProvider: Fragment } : null;
    const formRef = useRef(contextFormReturn);
    const previousDepsRef = useRef(undefined);
    const depsChanged = !!deps?.length &&
        (!previousDepsRef.current ||
            deps.length !== previousDepsRef.current.length ||
            deps.some((dep, index) => dep !== previousDepsRef.current?.[index]));
    if (depsChanged) {
        previousDepsRef.current = deps;
    }
    if (depsChanged || !formRef.current) {
        const form = new KeckForm({
            initial: options.initial,
            validate: options.validate,
            onSubmit: options.onSubmit,
            onSubmitAttempt: options.onSubmitAttempt,
        });
        const typedContext = keckFormContext;
        formRef.current = {
            form,
            FormProvider: ({ children }) => {
                return jsx(typedContext.Provider, { value: form, children: children });
            },
        };
    }
    const form = useObserver(formRef.current.form, [formRef.current.form]);
    form[reassignOptions](options);
    return {
        form,
        FormProvider: formRef.current.FormProvider,
    };
}

const zodValidator = (schema) => {
    return ((values, setError) => {
        const result = schema.safeParse(values);
        if (result.success)
            return result.data;
        for (const error of result.error.errors) {
            const path = error.path.join('.');
            setError(path, error.message);
        }
        return null;
    });
};

export { KeckField, KeckFieldArray, KeckFieldObject, KeckForm, useForm, useFormContext, zodValidator };
//# sourceMappingURL=index.js.map
