import { atomic, derive, unwrap, shallowCompare, observe, transformInPlace, peek, focus } from 'keck';
import { get as get$1, set, isEqual, unset, isEmpty, cloneDeep } from 'lodash-es';
import { jsx } from 'react/jsx-runtime';
import { useObserver } from 'keck/react';
import { useContext, useRef, createContext, Fragment } from 'react';

function get(obj, path) {
    return !path?.length ? obj : get$1(obj, path);
}

class KeckFieldBase {
    form;
    formState;
    path;
    constructor(form, formState, path) {
        this.form = form;
        this.formState = formState;
        this.path = path;
    }
    get value() {
        return get(this.formState.values, this.path);
    }
    set value(value) {
        atomic(() => {
            set(this.formState.values, this.path, value);
            this.form.validate();
        });
    }
    get dirty() {
        // Field is dirty if the value is different from the initial value
        return derive(() => {
            const initialValue = get(this.formState.initial, this.path);
            return !isEqual(unwrap(initialValue), unwrap(this.value));
        });
    }
    get touched() {
        return derive(() => {
            if (get(this.formState.touched, this.path))
                return true;
            // work up the path to see if any parent fields have allTouched
            const path = this.path.split('.');
            for (let i = path.length - 1; i >= 0; i--) {
                path.pop();
                // TODO: could be more performant by starting from the top and only descending if object?
                if (get(this.formState.touched, path.join('.')) === true)
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
                    this.formState.touched ||= {};
                    set(this.formState.touched, this.path, true);
                }
                else
                    this.formState.touched = true;
            }
            else if (this.path) {
                const path = this.path.split('.');
                unset(this.formState.touched, path);
                while (path.length) {
                    path.pop();
                    const pathValue = get(this.formState.touched, path);
                    if (isEmpty(pathValue) ||
                        (Array.isArray(pathValue) && pathValue.every((p) => isEmpty(p)))) {
                        unset(this.formState.touched, path);
                    }
                    else {
                        break;
                    }
                }
                if (isEmpty(this.formState.touched)) {
                    this.formState.touched = false;
                }
            }
            else {
                this.formState.touched = false;
            }
        });
    }
    get errors() {
        return derive(() => this.formState.errors[this.path] || [], shallowCompare);
    }
    get isValid() {
        return derive(() => this.errors.length === 0);
    }
    reset() {
        atomic(() => {
            set(this.formState.values, this.path, cloneDeep(get(this.formState.initial, this.path)));
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
    get errors() {
        return derive(() => {
            return Object.entries(this.formState.errors)
                .filter(([key]) => key.startsWith(this.path))
                .flatMap(([, value]) => value);
        }, shallowCompare);
    }
}

class KeckFieldObject extends KeckFieldBase {
    field(_path) {
        return this.form.field(`${this.path}.${_path}`);
    }
    get errors() {
        return derive(() => {
            return Object.entries(this.formState.errors)
                .filter(([key]) => key.startsWith(this.path))
                .flatMap(([, value]) => value);
        }, shallowCompare);
    }
}

const stateAccessor = Symbol('state');
const reassignOptions = Symbol('reassignOptions');
/**
 * The base class for a Keck Form, which is created by providing a state object. The state object should be a configured Keck observer.
 *
 * Note that a KeckForm is just a wrapper around an existing state object. Multiple KeckForm objects can exist that wrap
 * different Keck observers of the same underlying state object.
 */
class KeckForm {
    [stateAccessor];
    validator;
    onSubmit;
    onSubmitAttempt;
    constructor(options) {
        if ('form' in options) {
            this[stateAccessor] = options.state;
            this.validator = options.form.validator;
            this.onSubmit = options.form.onSubmit;
            this.onSubmitAttempt = options.form.onSubmitAttempt;
        }
        else if ('initial' in options) {
            this.validator = options.validate;
            this.onSubmit = options.onSubmit;
            this.onSubmitAttempt = options.onSubmitAttempt;
            this[stateAccessor] = observe({
                initial: options.initial,
                values: cloneDeep(options.initial),
                errors: {},
                touched: null,
                output: null,
                isSubmitting: false,
                submitCount: 0,
                submitAttemptCount: 0,
            });
            this.validate();
        }
        else {
            throw new Error('Invalid options provided to KeckForm constructor');
        }
    }
    [reassignOptions](options) {
        this.validator = options.validate;
        this.onSubmit = options.onSubmit;
        this.onSubmitAttempt = options.onSubmitAttempt;
    }
    get initial() {
        return this[stateAccessor].initial;
    }
    set initial(value) {
        this[stateAccessor].initial = value;
    }
    get output() {
        return this[stateAccessor].output;
    }
    get value() {
        return this.field('').value;
    }
    validate() {
        return atomic(() => {
            const errors = {};
            this[stateAccessor].output = this.validator(cloneDeep(unwrap(this[stateAccessor].values)), (field, error, action = 'push') => {
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
            });
            this[stateAccessor].errors = transformInPlace(this[stateAccessor].errors, errors);
            return unwrap(this[stateAccessor].output);
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
    /**
     * Resets the form state. You can optionally reset specific parts of the form state:
     * - **values** - Reset the values to the initial values.
     * - **touched** - Reset the touched state to null.
     * - **submit** - Reset the submit count and submit attempt count to 0.
     */
    reset(resetOptions) {
        atomic(() => {
            if (!resetOptions || resetOptions.values === true)
                this[stateAccessor].values = cloneDeep(unwrap(this[stateAccessor].initial));
            if (!resetOptions || resetOptions.touched === true)
                this[stateAccessor].touched = null;
            if (!resetOptions || resetOptions.submit === true) {
                this[stateAccessor].submitCount = 0;
                this[stateAccessor].submitAttemptCount = 0;
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
            const value = get(this[stateAccessor].values, path);
            // TFormInput could be 'unknown', which KeckFieldArray and KeckFieldObject won't accept.
            // But we know the type, and the field() method return type is explicit, so we can cast values as any to ignore TS errors.
            if (Array.isArray(value))
                return new KeckFieldArray(this, this[stateAccessor], path);
            if (typeof value === 'object')
                return new KeckFieldObject(this, this[stateAccessor], path);
            return new KeckField(this, this[stateAccessor], path);
        });
    }
    focus() {
        focus(this[stateAccessor]);
        return this;
    }
    /**
     * Adds a callback that will be called when the form state changes. This returns a new KeckForm
     * object that can be used to observe specific fields in the form. E.g.:
     *
     * ```ts
     * import { focus } from 'keck';
     *
     * const form = new KeckForm({ ... })
     *
     * // Add an observer callback
     * const formObserver = form.observe(() => { console.log('form changed') });
     *
     * // Optional: "focus" the formObserver (using Keck's `focus` method) to ensure the callback is
     * // only called upon changes to the specific properties accessed on this formObserver.
     * // (If you don't call `focus`, the callback will be called on any change to the form state.)
     * focus(formObserver);
     * formObserver.field('name').value; // Access a property to observe changes to it
     *
     * // Changing a field value will trigger the callback:
     * form.field('name').value = 'Jane'; // logs 'form changed'
     * ```
     */
    observe(callback) {
        return new KeckForm({
            form: this,
            state: observe(this[stateAccessor], callback),
        });
    }
    /**
     * Call this function to submit the form.
     *
     * If the form is valid, the onSubmit function will be called and the submitCount field will be incremented.
     *
     * If the form is not valid, the onSubmitAttempt function will be called and the submitAttemptCount field will be incremented.
     */
    handleSubmit = async (e) => {
        // Prevent default form submission if this is called from a form submit event
        e?.preventDefault?.();
        const output = this.validate();
        try {
            this[stateAccessor].isSubmitting = true;
            this[stateAccessor].submitAttemptCount++;
            if (output && this.isValid) {
                this[stateAccessor].submitCount++;
                await this.onSubmit?.(output);
            }
            else {
                await this.onSubmitAttempt?.();
            }
        }
        finally {
            this[stateAccessor].isSubmitting = false;
        }
    };
    get isSubmitting() {
        return this[stateAccessor].isSubmitting;
    }
    get submitCount() {
        return this[stateAccessor].submitCount;
    }
    get submitAttemptCount() {
        return this[stateAccessor].submitAttemptCount;
    }
}

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
    const state = useObserver(form?.[stateAccessor]);
    const formRef = useRef(null);
    if (!formRef.current) {
        formRef.current = new KeckForm({ form, state });
    }
    return formRef.current;
}

const keckFormContext = createContext(null);
function useForm(options) {
    const context = useFormContext(true);
    const contextFormReturn = options.tryContext && context ? { form: context, FormProvider: Fragment } : null;
    const formRef = useRef(contextFormReturn);
    if (!formRef.current) {
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
    formRef.current.form[reassignOptions](options);
    formRef.current.form[stateAccessor] = useObserver(formRef.current.form[stateAccessor]);
    formRef.current.form.initial = options.initial;
    return formRef.current;
}

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

export { KeckField, KeckFieldArray, KeckFieldObject, KeckForm, useForm, useFormContext, zodValidator };
//# sourceMappingURL=index.js.map
