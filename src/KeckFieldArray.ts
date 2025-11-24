import { derive } from 'keck';
import { KeckFieldBase, type KeckFieldForPath } from './KeckField';
import { $errors } from './KeckForm.internalFields';
import type { StringPaths } from './types';

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
    _callback: (
      field: KeckFieldForPath<
        TFormInput,
        `${TStringPath}.${number}` extends StringPaths<TFormInput>
          ? `${TStringPath}.${number}`
          : never
      >,
      index: number,
    ) => TReturn,
  ): TReturn[] {
    return [];
  }

  get allErrors(): Array<{ path: string; errors: string[] }> {
    return derive(
      () => {
        const entries = Object.entries(this.form[$errors]).filter(([key]) =>
          key.startsWith(this.path),
        );
        return entries.map(([path, errors]) => ({ path, errors }));
      },
      (a, b) => JSON.stringify(a) === JSON.stringify(b),
    );
  }

  // push(value: Get<TFormInput, `${TStringPath}.${number}`>): void {
  //   this.stateObserver.values[this.path].push(value);
  // }
  //
  // pop(): Get<TFormInput, `${TStringPath}.${number}`> | undefined {
  //   return this.stateObserver.values[this.path].pop();
  // }
  //
  // remove(index: number): void {
  //   this.stateObserver.values[this.path].splice(index, 1);
  // }
  //
  // shift(): Get<TFormInput, `${TStringPath}.${number}`> | undefined {
  //   return this.stateObserver.values[this.path].shift();
  // }
  //
  // unshift(value: Get<TFormInput, `${TStringPath}.${number}`>): void {
  //   this.stateObserver.values[this.path].unshift(value);
  // }
  //
  // swap(indexA: number, indexB: number): void {
  //   const array = this.stateObserver.values[this.path];
  //   [array[indexA], array[indexB]] = [array[indexB], array[indexA]];
  // }
  //
  // insert(index: number, value: Get<TFormInput, `${TStringPath}.${number}`>): void {
  //   this.stateObserver.values[this.path].splice(index, 0, value);
  // }
  //
  // clear(): void {
  //   this.stateObserver.values[this.path] = [];
  // }
}
