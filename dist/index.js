import { atomic, derive, unwrap, observe, peek, focus } from 'keck';
import { get as get$1, set, isEqual, isEmpty, cloneDeep } from 'lodash-es';
import { jsx } from 'react/jsx-runtime';
import { createContext, useContext } from 'react';

function get(obj, path) {
    return !path ? obj : get$1(obj, path);
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
                return;
            }
            if (this.path) {
                set(this.formState.touched, this.path, false);
                const path = this.path.split('.');
                for (let i = path.length - 1; i >= 0; i--) {
                    path.pop();
                    if (!isEmpty(get(this.formState.touched, path.join('.'))))
                        return;
                    if (path.length)
                        set(this.formState.touched, path.join('.'), undefined);
                    else
                        this.formState.touched = undefined;
                }
            }
            else
                this.formState.touched = false;
        });
    }
    get errors() {
        return this.formState.errors[this.path] || [];
    }
    get isValid() {
        return derive(() => this.errors.length === 0);
    }
    // protected getFieldState(path: string = this.path, create = true): any {
    //   let state = get(this.formState.state, path)?.[fieldState];
    //   if (!state && create) {
    //     state = {};
    //     set(this.formState.state, path, { [fieldState]: state });
    //   }
    //   return get(this.formState.state, path)?.[fieldState];
    // }
    getParentPath() {
        return this.path.split('.').slice(0, -1).join('.');
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
}

class KeckFieldObject extends KeckFieldBase {
    field(_path) {
        return null;
    }
}

class KeckFormBase {
    state;
    constructor(state, callback) {
        this.state = observe(state, callback);
    }
    get initial() {
        return this.state.initial;
    }
    set initial(value) {
        this.state.initial = value;
    }
    get output() {
        return this.state.output;
    }
    validate() {
        return atomic(() => {
            this.state.errors = {};
            this.state.output = this.state.validator(cloneDeep(unwrap(this.state.values)), (field, error, action = 'push') => {
                if (!error) {
                    delete this.state.errors[field];
                    return;
                }
                this.state.errors[field] ||= [];
                if (action === 'push')
                    this.state.errors[field].push(error);
                else if (action === 'unshift')
                    this.state.errors[field].unshift(error);
                else
                    this.state.errors[field] = [error];
            });
            return unwrap(this.state.output);
        });
    }
    get isValid() {
        return derive(() => Object.keys(this.state.errors).length === 0);
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
            const value = get(this.state.values, path);
            // TFormInput could be 'unknown', which KeckFieldArray and KeckFieldObject won't accept.
            // But we know the type, and the field() method return type is explicit, so we can cast values as any to ignore TS errors.
            if (Array.isArray(value))
                return new KeckFieldArray(this, this.state, path);
            if (typeof value === 'object')
                return new KeckFieldObject(this, this.state, path);
            return new KeckField(this, this.state, path);
        });
    }
    focus() {
        focus(this.state);
        return this;
    }
}
class KeckForm extends KeckFormBase {
    constructor(options) {
        super({
            initial: options.initial,
            values: cloneDeep(options.initial),
            errors: {},
            touched: null,
            output: null,
            validator: options.validate,
        });
        this.state.output = this.validate();
    }
    /**
     * Adds a callback that will be called when the form state changes. This returns a FormObserver
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
        return new KeckFormObserver(this, this.state, callback);
    }
}
class KeckFormObserver extends KeckFormBase {
    ownerForm;
    constructor(ownerForm, state, callback) {
        super(state, callback);
        this.ownerForm = ownerForm;
    }
}

const keckFormContext = createContext(null);
function useForm(options) {
    const form = new KeckForm({
        initial: options.initial,
        validate: options.validate,
    });
    const typedContext = keckFormContext;
    return {
        form,
        field: form.field,
        FormProvider: ({ children }) => {
            return jsx(typedContext.Provider, { value: form, children: children });
        },
    };
}

function useFormContext() {
    const form = useContext(keckFormContext);
    if (!form) {
        throw new Error('useFormContext must be used within a FormProvider');
    }
    return {
        form: form,
        field: form.field,
    };
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
