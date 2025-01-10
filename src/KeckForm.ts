import { atomic, derive, focus, observe, peek, unwrap } from 'keck';
import { cloneDeep } from 'lodash-es';
import { KeckField } from './KeckField';
import { KeckFieldArray } from './KeckFieldArray';
import { KeckFieldObject } from './KeckFieldObject';
import type { FormValidatorFn, KeckFieldForPath, ObjectOrUnknown, StringPath } from './types';
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

export abstract class KeckFormBase<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> {
  protected state: KeckFormState<TFormInput, TFormOutput>;

  constructor(state: KeckFormState<TFormInput, TFormOutput>, callback?: () => void) {
    this.state = observe(state, callback);
  }

  get initial() {
    return this.state.initial;
  }

  set initial(value: TFormInput) {
    this.state.initial = value;
  }

  get output() {
    return this.state.output;
  }

  validate(): TFormOutput {
    return atomic(() => {
      this.state.errors = {};
      this.state.output = this.state.validator(
        cloneDeep(unwrap(this.state.values)),
        (field, error, action = 'push') => {
          if (!error) {
            delete this.state.errors[field];
            return;
          }
          this.state.errors[field] ||= [];
          if (action === 'push') this.state.errors[field].push(error);
          else if (action === 'unshift') this.state.errors[field].unshift(error);
          else this.state.errors[field] = [error];
        },
      );
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
  field<TStringPath extends StringPath<TFormInput>>(
    path: TStringPath,
  ): KeckFieldForPath<TFormInput, TStringPath> {
    return peek(() => {
      const value = get(this.state.values, path);
      // TFormInput could be 'unknown', which KeckFieldArray and KeckFieldObject won't accept.
      // But we know the type, and the field() method return type is explicit, so we can cast values as any to ignore TS errors.
      if (Array.isArray(value))
        return new KeckFieldArray(this as any, this.state as any, path as any) as KeckFieldForPath<
          TFormInput,
          TStringPath
        >;
      if (typeof value === 'object')
        return new KeckFieldObject(this as any, this.state as any, path as any) as KeckFieldForPath<
          TFormInput,
          TStringPath
        >;
      return new KeckField(this, this.state, path) as KeckFieldForPath<TFormInput, TStringPath>;
    });
  }

  focus(): this {
    focus(this.state);
    return this;
  }
}

export class KeckForm<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> extends KeckFormBase<TFormInput, TFormOutput> {
  constructor(options: {
    initial: TFormInput;
    validate: FormValidatorFn<TFormInput, TFormOutput>;
  }) {
    super({
      initial: options.initial,
      values: cloneDeep(options.initial),
      errors: {},
      touched: null,
      output: null!,
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
  observe(callback: () => void) {
    return new KeckFormObserver(this, this.state, callback);
  }
}

export class KeckFormObserver<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> extends KeckFormBase<TFormInput, TFormOutput> {
  constructor(
    private ownerForm: KeckForm<TFormInput, TFormOutput>,
    state: KeckFormState<TFormInput, TFormOutput>,
    callback: () => void,
  ) {
    super(state, callback);
  }
}
