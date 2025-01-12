import { KeckFieldBase, type KeckFieldForPath } from './KeckField';
import type { StringPath } from './types';

export class KeckFieldArray<
  TFormInput extends object,
  TStringPath extends StringPath<TFormInput>,
> extends KeckFieldBase<TFormInput, TStringPath> {
  /**
   * Maps each field in the array to a new value by invoking the callback function.
   */
  map<TReturn>(
    _callback: (
      field: KeckFieldForPath<
        TFormInput,
        `${TStringPath}.${number}` extends StringPath<TFormInput>
          ? `${TStringPath}.${number}`
          : never
      >,
      index: number,
    ) => TReturn,
  ): TReturn[] {
    return [];
  }

  // push(value: ValueAtPath<TFormInput, `${TStringPath}.${number}`>): void {
  //   this.stateObserver.values[this.path].push(value);
  // }
  //
  // pop(): ValueAtPath<TFormInput, `${TStringPath}.${number}`> | undefined {
  //   return this.stateObserver.values[this.path].pop();
  // }
  //
  // remove(index: number): void {
  //   this.stateObserver.values[this.path].splice(index, 1);
  // }
  //
  // shift(): ValueAtPath<TFormInput, `${TStringPath}.${number}`> | undefined {
  //   return this.stateObserver.values[this.path].shift();
  // }
  //
  // unshift(value: ValueAtPath<TFormInput, `${TStringPath}.${number}`>): void {
  //   this.stateObserver.values[this.path].unshift(value);
  // }
  //
  // swap(indexA: number, indexB: number): void {
  //   const array = this.stateObserver.values[this.path];
  //   [array[indexA], array[indexB]] = [array[indexB], array[indexA]];
  // }
  //
  // insert(index: number, value: ValueAtPath<TFormInput, `${TStringPath}.${number}`>): void {
  //   this.stateObserver.values[this.path].splice(index, 0, value);
  // }
  //
  // clear(): void {
  //   this.stateObserver.values[this.path] = [];
  // }
}
