import { atomic, derive, unwrap } from 'keck';
import type { KeckFormBase, KeckFormState } from 'keck-forms/KeckForm';
import type { StringPath, ValueAtPath } from 'keck-forms/types';
import { get } from 'keck-forms/util/get';
import { isEmpty, isEqual, set } from 'lodash-es';

export abstract class KeckFieldBase<
  TFormInput extends object,
  TStringPath extends StringPath<TFormInput>,
> {
  constructor(
    public readonly form: KeckFormBase<TFormInput, any>,
    protected readonly formState: KeckFormState<TFormInput, any>,
    public readonly path: TStringPath,
  ) {}

  get value(): ValueAtPath<TFormInput, TStringPath> {
    return get(this.formState.values, this.path) as ValueAtPath<TFormInput, TStringPath>;
  }

  set value(value: ValueAtPath<TFormInput, TStringPath>) {
    atomic(() => {
      set(this.formState.values, this.path, value);
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
    return (this.formState.errors[this.path] as string[]) || [];
  }

  get isValid(): boolean {
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

  protected getParentPath(): string {
    return this.path.split('.').slice(0, -1).join('.');
  }
}

export class KeckField<
  TFormInput extends object,
  TStringPath extends StringPath<TFormInput>,
> extends KeckFieldBase<TFormInput, TStringPath> {}
