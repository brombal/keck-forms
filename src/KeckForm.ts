import { atomic, observe, peek, registerObservableClass, transformInPlace, unwrap } from 'keck';
import { cloneDeep } from 'lodash-es';
import type { IsNever, IsUnknown } from 'type-fest';
import { KeckField, type KeckFieldForPath, type TypedKeckField } from './KeckField';
import { KeckFieldArray } from './KeckFieldArray';
import { KeckFieldObject } from './KeckFieldObject';
import { $errors, $touched, $values } from './KeckForm.internalFields';
import type { ObjectOrUnknown, StringPaths } from './types';
import { get } from './util/get';

export type FormValidatorFn<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> = (
  input: TFormInput,
  setError: (
    field: StringPaths<TFormInput>,
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
export type KeckFormOptions<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> =
  | {
      initial: TFormInput;
      validate: FormValidatorFn<TFormInput, TFormOutput>;
      onSubmit?: OnSubmitFn<TFormOutput>;
      onSubmitAttempt?: OnSubmitAttemptFn;
    }
  | {
      initial: TFormInput;
      validate?: never;
      onSubmit?: OnSubmitFn<TFormOutput>;
      onSubmitAttempt?: OnSubmitAttemptFn;
    };

export const reassignOptions = Symbol('reassignOptions');

/**
 * A KeckForm object represents the entire state of a form.
 */
export class KeckForm<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown = TFormInput,
> {
  initial: TFormInput;
  [$values]: TFormInput;
  [$touched]: any = null;
  [$errors]: Record<string, string[]> = {};
  private _output: TFormOutput | null = null;
  private _isSubmitting = false;
  private _submitCount = 0;
  private _submitAttemptCount = 0;
  private _submitError: any | null = null;

  private validator?: FormValidatorFn<TFormInput, TFormOutput>;
  private onSubmit: OnSubmitFn<TFormOutput> | undefined;
  private onSubmitAttempt: OnSubmitAttemptFn | undefined;

  /**
   * Creates a KeckForm by providing an initial state and a validation function.
   * @param options The initial state and validation function.
   */
  constructor(options: KeckFormOptions<TFormInput, TFormOutput>) {
    this.initial = options.initial;
    this[$values] = cloneDeep(options.initial);
    this.validator = options.validate;
    this.onSubmit = options.onSubmit;
    this.onSubmitAttempt = options.onSubmitAttempt;
    this.validate();
  }

  [reassignOptions](options: Partial<KeckFormOptions<TFormInput, TFormOutput>>) {
    if (options.onSubmit) this.onSubmit = options.onSubmit;
    if (options.onSubmitAttempt) this.onSubmitAttempt = options.onSubmitAttempt;
    if (options.validate) this.validator = options.validate;
    if (options.initial) this.initial = options.initial;
  }

  get output() {
    return this._output;
  }

  get value(): TFormInput {
    return this.field('' as any).value as TFormInput;
  }

  validate(): TFormOutput | null {
    return atomic(() => {
      const errors = {} as Record<string, string[]>;
      const input = cloneDeep(unwrap(this[$values]));
      this._output = this.validator
        ? this.validator(input, (field, error, action = 'push') => {
            if (!error && error !== '') {
              delete errors[field];
              return;
            }
            errors[field] ||= [];
            if (action === 'push') errors[field].push(error);
            else if (action === 'unshift') errors[field].unshift(error);
            else errors[field] = [error];
          })
        : (input as unknown as TFormOutput);
      this[$errors] = transformInPlace(this[$errors], errors);
      return unwrap(this._output);
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
        this[$values] = cloneDeep(unwrap(this.initial));
      if (!resetOptions || resetOptions.touched === true) this[$touched] = null;
      if (!resetOptions || resetOptions.submit === true) {
        this._submitCount = 0;
        this._submitAttemptCount = 0;
      }
      this.validate();
    });
  }

  field<TReturn = never, TPath extends string = StringPaths<TFormInput>>(
    path: IsNever<TReturn> extends true ? TPath & StringPaths<TFormInput> : string,
  ): IsNever<TReturn> extends true
    ? IsUnknown<TFormInput> extends true
      ? TypedKeckField<unknown> // If TReturn is not specified and TFormInput is unknown, return KeckField of unknown type
      : TPath extends StringPaths<TFormInput>
        ? KeckFieldForPath<TFormInput, TPath> // If TReturn is not specified but form input type is known, return KeckFieldForPath
        : never // If TReturn is not specified and TPath is not a valid path of TFormInput, return never
    : TypedKeckField<TReturn>; // If TReturn is specified, return TypedKeckField of that type

  /**
   * Returns a KeckField object for the given path. This can be used to access the field value,
   * errors, and other state.
   *
   * By focusing (with Keck's `focus` method) this FormObserver, you can ensure the callback is only called upon
   * changes to specific fields in the form.
   *
   * @param path The path to access.
   */
  field(path?: string): any {
    return peek(() => {
      const value = get(this[$values], path);
      // TFormInput could be 'unknown', which KeckFieldArray and KeckFieldObject won't accept.
      // But we know the type, and the field() method return type is explicit, so we can cast values as any to ignore TS errors.
      if (Array.isArray(value)) return new KeckFieldArray(this as any, path as any);
      if (typeof value === 'object') return new KeckFieldObject(this as any, path as any);
      return new KeckField(this as any, path as any);
    });
  }

  private async _handleSubmit(e?: any) {
    // Prevent default form submission if this is called from a form submit event
    e?.preventDefault?.();

    const output = this.validate();
    try {
      this._isSubmitting = true;
      this._submitAttemptCount++;
      if (output && this.isValid) {
        this._submitCount++;
        await this.onSubmit?.(output);
      } else {
        await this.onSubmitAttempt?.();
      }
    } catch (e: any) {
      this._submitError = e;
    } finally {
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
  handleSubmit = async (e?: any) => {
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
