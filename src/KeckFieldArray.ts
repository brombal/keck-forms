import { atomic, derive } from 'keck';
import { isEmpty, unset } from 'lodash-es';
import type { Get } from 'type-fest';
import { KeckFieldBase, type KeckFieldForPath } from './KeckField';
import { $errors, $touched, $values } from './KeckForm.internalFields';
import type { StringPaths } from './types';
import { get } from './util/get';

export class KeckFieldArray<
  TFormInput extends object,
  TStringPath extends string,
> extends KeckFieldBase<TFormInput, TStringPath> {
  field<TPath extends string>(
    _path: TPath,
  ): `${TStringPath}.${TPath}` extends StringPaths<TFormInput>
    ? KeckFieldForPath<
        TFormInput,
        `${TStringPath}.${TPath}` extends StringPaths<TFormInput>
          ? `${TStringPath}.${TPath}`
          : never
      >
    : never {
    return this.form.field(`${this.path}.${_path}` as any) as any;
  }

  /**
   * Maps each field in the array to a new value by invoking the callback function.
   */
  map<TReturn>(
    callback: (
      field: KeckFieldForPath<
        TFormInput,
        `${TStringPath}.${number}` extends StringPaths<TFormInput>
          ? `${TStringPath}.${number}`
          : never
      >,
      index: number,
    ) => TReturn,
  ): TReturn[] {
    const array = get(this.form[$values], this.path) as unknown[];
    return array.map((_, i) => callback(this.field(String(i) as any) as any, i));
  }

  get allErrors(): Array<{ path: string; errors: string[] }> {
    return derive(
      () => {
        const entries = Object.entries(this.form[$errors]).filter(
          ([key]) => !this.path || key === this.path || key.startsWith(`${this.path}.`),
        );
        return entries.map(([path, errors]) => ({ path, errors }));
      },
      (a, b) => JSON.stringify(a) === JSON.stringify(b),
    );
  }

  // Returns the $touched array for this path, or null if none exists.
  private _touchedArray(): any[] | null {
    const touchedRoot = this.form[$touched];
    if (!touchedRoot || touchedRoot === true) return null;
    const arr = get(touchedRoot, this.path);
    return Array.isArray(arr) ? arr : null;
  }

  // Walks up the touched tree from this.path and unsets nodes that are empty.
  private _cleanupTouched(): void {
    const pathParts = this.path.split('.');
    while (pathParts.length) {
      const val = get(this.form[$touched], pathParts.join('.'));
      if (
        val !== true &&
        (isEmpty(val) || (Array.isArray(val) && (val as any[]).every((p: any) => isEmpty(p))))
      ) {
        unset(this.form[$touched], pathParts);
      } else {
        break;
      }
      pathParts.pop();
    }
    if (isEmpty(this.form[$touched])) {
      this.form[$touched] = false;
    }
  }

  push(value: Get<TFormInput, `${TStringPath}.${number}`>): void {
    atomic(() => {
      (get(this.form[$values], this.path) as any[]).push(value);
      // New element is untouched by default — no touched state to update.
    });
  }

  pop(): Get<TFormInput, `${TStringPath}.${number}`> | undefined {
    return atomic(() => {
      const result = (get(this.form[$values], this.path) as any[]).pop();
      this._touchedArray()?.pop();
      this._cleanupTouched();
      return result;
    });
  }

  remove(index: number): void {
    atomic(() => {
      (get(this.form[$values], this.path) as any[]).splice(index, 1);
      this._touchedArray()?.splice(index, 1);
      this._cleanupTouched();
    });
  }

  shift(): Get<TFormInput, `${TStringPath}.${number}`> | undefined {
    return atomic(() => {
      const result = (get(this.form[$values], this.path) as any[]).shift();
      this._touchedArray()?.shift();
      this._cleanupTouched();
      return result;
    });
  }

  unshift(value: Get<TFormInput, `${TStringPath}.${number}`>): void {
    atomic(() => {
      (get(this.form[$values], this.path) as any[]).unshift(value);
      this._touchedArray()?.unshift(null);
    });
  }

  swap(indexA: number, indexB: number): void {
    atomic(() => {
      const array = get(this.form[$values], this.path) as any[];
      [array[indexA], array[indexB]] = [array[indexB], array[indexA]];
      const touched = this._touchedArray();
      if (touched) {
        [touched[indexA], touched[indexB]] = [touched[indexB], touched[indexA]];
      }
    });
  }

  insert(index: number, value: Get<TFormInput, `${TStringPath}.${number}`>): void {
    atomic(() => {
      (get(this.form[$values], this.path) as any[]).splice(index, 0, value);
      this._touchedArray()?.splice(index, 0, null);
    });
  }

  clear(): void {
    atomic(() => {
      (get(this.form[$values], this.path) as any[]).length = 0;
      const touched = this._touchedArray();
      if (touched) touched.length = 0;
      this._cleanupTouched();
    });
  }
}
