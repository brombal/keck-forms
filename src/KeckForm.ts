import { atomic, derive, focus, observe, peek, unwrap } from 'keck';
import { cloneDeep } from 'lodash-es';
import { KeckField, type KeckFieldForPath, type TypedKeckField } from './KeckField';
import { KeckFieldArray } from './KeckFieldArray';
import { KeckFieldObject } from './KeckFieldObject';
import type { ObjectOrUnknown, StringPath } from './types';
import { get } from './util/get';

export interface KeckFormState<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> {
  initial: TFormInput;
  values: TFormInput;
  output: TFormOutput | null;
  touched: any;
  errors: Record<string, string[]>;
  validator: FormValidatorFn<TFormInput, TFormOutput>;
}

export type FormValidatorFn<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> = (
  input: TFormInput,
  setError: (
    field: StringPath<TFormInput>,
    error: string | null | undefined | false,
    action?: 'push' | 'unshift' | 'replace',
  ) => void,
) => TFormOutput | null;

/**
 * The public interface for the KeckForm class constructor parameters.
 */
export interface KeckFormOptions<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> {
  initial: TFormInput;
  validate: FormValidatorFn<TFormInput, TFormOutput>;
}

/**
 * The internal interface for the KeckForm class constructor parameters.
 */
export type KeckFormOptionsInternal<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> = KeckFormOptions<TFormInput, TFormOutput> & {
  state: KeckFormState<TFormInput, TFormOutput>;
};

export const state = Symbol('state');

/**
 * The base class for a Keck Form, which is created by providing a state object. The state object should be a configured Keck observer.
 *
 * Note that a KeckForm is just a wrapper around an existing state object. Multiple KeckForm objects can exist that wrap
 * different Keck observers of the same underlying state object.
 */
export class KeckForm<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> {
  private [state]: KeckFormState<TFormInput, TFormOutput>;

  /**
   * Creates a KeckForm by providing an initial state and a validation function.
   * @param options The initial state and validation function.
   */
  constructor(options: KeckFormOptions<TFormInput, TFormOutput>) {
    const _state = (options as unknown as KeckFormOptionsInternal<TFormInput, TFormOutput>).state;
    if (_state) {
      this[state] = _state;
    } else {
      this[state] = observe({
        initial: options.initial,
        values: cloneDeep(options.initial),
        errors: {},
        touched: null,
        output: null!,
        validator: options.validate,
      });
      this.validate();
    }
  }

  get initial() {
    return this[state].initial;
  }

  set initial(value: TFormInput) {
    this[state].initial = value;
  }

  get output() {
    return this[state].output;
  }

  validate(): TFormOutput {
    return atomic(() => {
      this[state].errors = {};
      this[state].output = this[state].validator(
        cloneDeep(unwrap(this[state].values)),
        (field, error, action = 'push') => {
          if (!error) {
            delete this[state].errors[field];
            return;
          }
          this[state].errors[field] ||= [];
          if (action === 'push') this[state].errors[field].push(error);
          else if (action === 'unshift') this[state].errors[field].unshift(error);
          else this[state].errors[field] = [error];
        },
      );
      return unwrap(this[state].output);
    });
  }

  get isValid() {
    return derive(() => Object.keys(this[state].errors).length === 0);
  }

  reset() {
    atomic(() => {
      this[state].values = cloneDeep(this[state].initial);
      this[state].touched = null;
      this.validate();
    });
  }

  field<TReturn>(
    _path: unknown extends TFormInput ? string : never,
  ): unknown extends TFormInput ? TypedKeckField<TReturn> : never;

  field<TStringPath extends StringPath<TFormInput>>(
    _path: unknown extends TFormInput ? never : TStringPath,
  ): unknown extends TFormInput ? never : KeckFieldForPath<TFormInput, TStringPath>;

  /**
   * Returns a KeckField object for the given path. This can be used to access the field value,
   * errors, and other state.
   *
   * By focusing (with Keck's `focus` method) this FormObserver, you can ensure the callback is only called upon
   * changes to specific fields in the form.
   *
   * @param path The path to access.
   */
  field(path: string): any {
    return peek(() => {
      const value = get(this[state].values, path);
      // TFormInput could be 'unknown', which KeckFieldArray and KeckFieldObject won't accept.
      // But we know the type, and the field() method return type is explicit, so we can cast values as any to ignore TS errors.
      if (Array.isArray(value))
        return new KeckFieldArray(this as any, this[state] as any, path as any);
      if (typeof value === 'object')
        return new KeckFieldObject(this as any, this[state] as any, path as any);
      return new KeckField(this, this[state], path as any);
    });
  }

  focus(): this {
    focus(this[state]);
    return this;
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
  observe(callback: () => void) {
    return new KeckForm({ state: observe(this[state], callback) } as KeckFormOptionsInternal<
      TFormInput,
      TFormOutput
    >);
  }

  get state() {
    return this[state];
  }
}
