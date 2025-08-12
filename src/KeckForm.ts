import { atomic, focus, observe, peek, transformInPlace, unwrap } from 'keck';
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
  isSubmitting: boolean;
  submitCount: number;
  submitAttemptCount: number;
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

export type OnSubmitFn<TFormOutput extends ObjectOrUnknown> = (
  output: TFormOutput,
) => Promise<void> | void;
export type OnSubmitAttemptFn = () => Promise<void> | void;

/**
 * The public interface for the KeckForm class constructor parameters.
 */
export interface KeckFormOptions<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> {
  initial: TFormInput;
  validate: FormValidatorFn<TFormInput, TFormOutput>;
  onSubmit?: OnSubmitFn<TFormOutput>;
  onSubmitAttempt?: OnSubmitAttemptFn;
}

/**
 * The internal interface for the KeckForm class constructor parameters.
 */
export type KeckFormOptionsInternal<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> = {
  form: KeckForm<TFormInput, TFormOutput>;
  state: KeckFormState<TFormInput, TFormOutput>;
};

export const stateAccessor = Symbol('state');
export const reassignOptions = Symbol('reassignOptions');

/**
 * The base class for a Keck Form, which is created by providing a state object. The state object should be a configured Keck observer.
 *
 * Note that a KeckForm is just a wrapper around an existing state object. Multiple KeckForm objects can exist that wrap
 * different Keck observers of the same underlying state object.
 */
export class KeckForm<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> {
  private [stateAccessor]: KeckFormState<TFormInput, TFormOutput>;

  private shared: {
    validate: FormValidatorFn<TFormInput, TFormOutput>;
    onSubmit: OnSubmitFn<TFormOutput> | undefined;
    onSubmitAttempt: OnSubmitAttemptFn | undefined;
  };

  /**
   * Creates a KeckForm by providing an initial state and a validation function.
   * @param options The initial state and validation function.
   */
  constructor(options: KeckFormOptionsInternal<TFormInput, TFormOutput>);
  constructor(options: KeckFormOptions<TFormInput, TFormOutput>);
  constructor(
    options:
      | KeckFormOptions<TFormInput, TFormOutput>
      | KeckFormOptionsInternal<TFormInput, TFormOutput>,
  ) {
    if ('form' in options) {
      this[stateAccessor] = options.state;
      this.shared = options.form.shared;
    } else if ('initial' in options) {
      this[stateAccessor] = observe({
        initial: options.initial,
        values: cloneDeep(options.initial),
        errors: {},
        touched: null,
        output: null!,
        isSubmitting: false,
        submitCount: 0,
        submitAttemptCount: 0,
      });
      this.shared = {
        validate: options.validate,
        onSubmit: options.onSubmit,
        onSubmitAttempt: options.onSubmitAttempt,
      };
      this.validate();
    } else {
      throw new Error('Invalid options provided to KeckForm constructor');
    }
  }

  [reassignOptions](options: Partial<KeckFormOptions<TFormInput, TFormOutput>>) {
    if (options.onSubmit) this.shared.onSubmit = options.onSubmit;
    if (options.onSubmitAttempt) this.shared.onSubmitAttempt = options.onSubmitAttempt;
    if (options.validate) this.shared.validate = options.validate;
    if (options.initial) this[stateAccessor].initial = options.initial;
  }

  get initial() {
    return this[stateAccessor].initial;
  }

  set initial(value: TFormInput) {
    this[stateAccessor].initial = value;
  }

  get output() {
    return this[stateAccessor].output;
  }

  get value(): TFormInput {
    return this.field('' as any).value as TFormInput;
  }

  validate(): TFormOutput | null {
    return atomic(() => {
      const errors = {} as Record<string, string[]>;
      this[stateAccessor].output = this.shared.validate(
        cloneDeep(unwrap(this[stateAccessor].values)),
        (field, error, action = 'push') => {
          if (!error) {
            delete errors[field];
            return;
          }
          errors[field] ||= [];
          if (action === 'push') errors[field].push(error);
          else if (action === 'unshift') errors[field].unshift(error);
          else errors[field] = [error];
        },
      );
      this[stateAccessor].errors = transformInPlace(this[stateAccessor].errors, errors);
      return unwrap(this[stateAccessor].output);
    });
  }

  get isValid() {
    return this.field('' as any).isValid;
  }

  get dirty() {
    return this.field('' as any).dirty;
  }

  get touched() {
    return this.field('' as any).touched;
  }

  set touched(touched: boolean) {
    this.field('' as any).touched = touched;
  }

  get errors() {
    return this.field('' as any).errors;
  }

  get allErrors() {
    return this.field('' as any).allErrors;
  }

  /**
   * Resets the form state. You can optionally reset specific parts of the form state:
   * - **values** - Reset the values to the initial values.
   * - **touched** - Reset the touched state to null.
   * - **submit** - Reset the submit count and submit attempt count to 0.
   */
  reset(resetOptions?: {
    values?: boolean;
    touched?: boolean;
    submit?: boolean;
  }) {
    atomic(() => {
      if (!resetOptions || resetOptions.values === true)
        this[stateAccessor].values = cloneDeep(unwrap(this[stateAccessor].initial));
      if (!resetOptions || resetOptions.touched === true) this[stateAccessor].touched = null;
      if (!resetOptions || resetOptions.submit === true) {
        this[stateAccessor].submitCount = 0;
        this[stateAccessor].submitAttemptCount = 0;
      }
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
      const value = get(this[stateAccessor].values, path);
      // TFormInput could be 'unknown', which KeckFieldArray and KeckFieldObject won't accept.
      // But we know the type, and the field() method return type is explicit, so we can cast values as any to ignore TS errors.
      if (Array.isArray(value))
        return new KeckFieldArray(this as any, this[stateAccessor] as any, path as any);
      if (typeof value === 'object')
        return new KeckFieldObject(this as any, this[stateAccessor] as any, path as any);
      return new KeckField(this as any, this[stateAccessor], path as any);
    });
  }

  focus(): this {
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
  observe(callback: () => void) {
    return new KeckForm({
      form: this,
      state: observe(this[stateAccessor], callback),
    } as KeckFormOptionsInternal<TFormInput, TFormOutput>);
  }

  /**
   * Call this function to submit the form.
   *
   * If the form is valid, the onSubmit function will be called and the submitCount field will be incremented.
   *
   * If the form is not valid, the onSubmitAttempt function will be called and the submitAttemptCount field will be incremented.
   */
  handleSubmit = async (e?: any) => {
    // Prevent default form submission if this is called from a form submit event
    e?.preventDefault?.();

    const output = this.validate();
    try {
      this[stateAccessor].isSubmitting = true;
      this[stateAccessor].submitAttemptCount++;
      if (output && this.isValid) {
        this[stateAccessor].submitCount++;
        await this.shared.onSubmit?.(output);
      } else {
        await this.shared.onSubmitAttempt?.();
      }
    } finally {
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
