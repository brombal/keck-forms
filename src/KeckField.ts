import { atomic, derive, shallowCompare, unwrap } from 'keck';
import { isEmpty, isEqual, set } from 'lodash-es';
import type { KeckFieldArray } from './KeckFieldArray';
import type { KeckFieldObject } from './KeckFieldObject';
import type { KeckForm, KeckFormState } from './KeckForm';
import type { ObjectOrUnknown, StringPath, ValueAtPath } from './types';
import { get } from './util/get';

export type KeckFieldForPath<
  TFormInput extends ObjectOrUnknown,
  TStringPath extends StringPath<TFormInput>,
> = TFormInput extends object
  ? ValueAtPath<TFormInput, TStringPath> extends Array<infer _TFieldType>
    ? KeckFieldArray<TFormInput, TStringPath>
    : ValueAtPath<TFormInput, TStringPath> extends object
      ? KeckFieldObject<TFormInput, TStringPath>
      : KeckField<TFormInput, TStringPath>
  : KeckField<TFormInput, TStringPath>;

/**
 * Used to represent a KeckField with an explicit type (instead of inferring a type from a form input structure
 * and a string path).
 */
export type TypedKeckField<TType> = Omit<KeckFieldBase<unknown, ''>, 'value'> & { value: TType };

export abstract class KeckFieldBase<
  TFormInput extends ObjectOrUnknown,
  TStringPath extends StringPath<TFormInput>,
> {
  constructor(
    public readonly form: KeckForm<TFormInput, unknown>,
    protected readonly formState: KeckFormState<TFormInput, unknown>,
    public readonly path: TStringPath,
  ) {}

  get value(): TFormInput extends object ? ValueAtPath<TFormInput, TStringPath> : unknown {
    return get(this.formState.values, this.path) as any;
  }

  set value(value: ValueAtPath<TFormInput, TStringPath>) {
    atomic(() => {
      set(this.formState.values as any, this.path, value);
      this.form.validate();
    });
  }

  get dirty(): boolean {
    // Field is dirty if the value is different from the initial value
    return derive(() => {
      const initialValue = get(this.formState.initial, this.path);
      return !isEqual(unwrap(initialValue), unwrap(this.value));
    });
  }

  get touched(): boolean {
    return derive(() => {
      if (get(this.formState.touched, this.path)) return true;

      // work up the path to see if any parent fields have allTouched
      const path = this.path.split('.');
      for (let i = path.length - 1; i >= 0; i--) {
        path.pop();
        // TODO: could be more performant by starting from the top and only descending if object?
        if (get(this.formState.touched, path.join('.')) === true) return true;
      }

      return false;
    });
  }

  set touched(value: boolean) {
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
        } else this.formState.touched = true;
        return;
      }

      if (this.path) {
        set(this.formState.touched, this.path, false);
        const path = this.path.split('.');
        for (let i = path.length - 1; i >= 0; i--) {
          path.pop();
          if (!isEmpty(get(this.formState.touched, path.join('.')))) return;
          if (path.length) set(this.formState.touched, path.join('.'), undefined);
          else this.formState.touched = undefined;
        }
      } else this.formState.touched = false;
    });
  }

  get errors(): string[] {
    return derive(() => (this.formState.errors[this.path] as string[]) || [], shallowCompare);
  }

  get isValid(): boolean {
    return derive(() => this.errors.length === 0);
  }
}

export class KeckField<
  TFormInput extends ObjectOrUnknown,
  TStringPath extends StringPath<TFormInput>,
> extends KeckFieldBase<TFormInput, TStringPath> {}
