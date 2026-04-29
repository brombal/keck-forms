import { atomic, derive, shallowCompare, unwrap } from 'keck';
import { cloneDeep, isEmpty, isEqual, set, unset } from 'lodash-es';
import type { KeckFieldArray } from './KeckFieldArray';
import type { KeckFieldObject } from './KeckFieldObject';
import type { KeckForm } from './KeckForm';
import { $errors, $touched, $values } from './KeckForm.internalFields';
import type { GetWithRoot, ObjectOrUnknown, StringPaths } from './types';
import { get } from './util/get';

export type KeckFieldForPath<
  TFormInput extends ObjectOrUnknown,
  TStringPath extends StringPaths<TFormInput>,
> = TStringPath extends string
  ? TFormInput extends object
    ? GetWithRoot<TFormInput, TStringPath> extends Array<infer _TFieldType>
      ? KeckFieldArray<TFormInput, TStringPath>
      : GetWithRoot<TFormInput, TStringPath> extends object
        ? KeckFieldObject<TFormInput, TStringPath>
        : KeckField<TFormInput, TStringPath>
    : never
  : never;

/**
 * Used to represent a KeckField with an explicit type (instead of inferring a type from a form input structure
 * and a string path).
 */
export type TypedKeckField<TType> = Omit<KeckFieldBase<unknown, ''>, 'value'> & { value: TType };

export abstract class KeckFieldBase<
  TFormInput extends ObjectOrUnknown,
  TStringPath extends string,
> {
  constructor(
    public readonly form: KeckForm<TFormInput, unknown>,
    public readonly path: TStringPath,
  ) {}

  get value(): TFormInput extends object ? GetWithRoot<TFormInput, TStringPath> : 5 {
    return get(this.form[$values], this.path) as any;
  }

  set value(value: GetWithRoot<TFormInput, TStringPath>) {
    atomic(() => {
      if (this.path) {
        set(this.form[$values] as object, this.path, value);
      } else {
        this.form[$values] = value as any;
      }
    });
  }

  get dirty(): boolean {
    // Field is dirty if the value is different from the initial value
    return derive(() => {
      const initialValue = get(this.form.initial, this.path);
      return !isEqual(unwrap(initialValue), unwrap(this.value));
    });
  }

  get touched(): boolean {
    return derive(() => {
      if (get(this.form[$touched], this.path)) return true;

      // work up the path to see if any parent fields have allTouched
      const path = this.path.split('.');
      for (let i = path.length - 1; i >= 0; i--) {
        path.pop();
        // TODO: could be more performant by starting from the top and only descending if object?
        if (get(this.form[$touched], path.join('.')) === true) return true;
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
          this.form[$touched] ||= {};
          set(this.form[$touched], this.path, true);
        } else this.form[$touched] = true;
      } else if (this.path) {
        const path = this.path.split('.');
        unset(this.form[$touched], path);

        while (path.length) {
          path.pop();
          const pathValue = get(this.form[$touched], path);
          if (
            isEmpty(pathValue) ||
            (Array.isArray(pathValue) && pathValue.every((p) => isEmpty(p)))
          ) {
            unset(this.form[$touched], path);
          } else {
            break;
          }
        }

        if (isEmpty(this.form[$touched])) {
          this.form[$touched] = false;
        }
      } else {
        this.form[$touched] = false;
      }
    });
  }

  get errors(): string[] {
    return derive(() => (this.form[$errors][this.path] as string[]) || [], shallowCompare);
  }

  get allErrors(): Array<{ path: string; errors: string[] }> {
    return derive(
      () =>
        this.form[$errors][this.path]
          ? [{ path: this.path, errors: this.form[$errors][this.path] || [] }]
          : [],
      (a, b) => JSON.stringify(a) === JSON.stringify(b),
    );
  }

  get isValid(): boolean {
    return derive(() => this.allErrors.length === 0);
  }

  reset() {
    atomic(() => {
      const value = cloneDeep(get(this.form.initial, this.path));
      if (this.path) {
        set(this.form[$values] as object, this.path, value);
      } else {
        this.form[$values] = value as any;
      }
      this.touched = false;
    });
  }
}

export class KeckField<
  TFormInput extends ObjectOrUnknown,
  TStringPath extends string,
> extends KeckFieldBase<TFormInput, TStringPath> {}
