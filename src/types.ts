import type { KeckField } from './KeckField';
import type { KeckFieldArray } from './KeckFieldArray';
import type { KeckFieldObject } from './KeckFieldObject';

export type StringPath<T> = T extends Array<infer _>
  ? `${number}` | `${number}.${StringPath<T[number]>}`
  : T extends object
    ?
        | {
            [K in keyof T & string]: `${K}` | `${K}.${StringPath<T[K]>}`;
          }[keyof T & string]
        | ''
    : never;

export type ValueAtPath<TValue, TPropString extends string> = TPropString extends ''
  ? TValue
  : TPropString extends `${infer Key}.${infer Rest}`
    ? TValue extends Array<infer TArrayValue>
      ? ValueAtPath<TArrayValue, Rest>
      : Key extends keyof TValue
        ? ValueAtPath<TValue[Key], Rest>
        : never
    : TValue extends Array<infer TArrayValue>
      ? TArrayValue
      : TPropString extends keyof TValue
        ? TValue[TPropString]
        : never;

export type ObjectOrUnknown = object | unknown;

export type GetFormFieldFn<TFormInput extends ObjectOrUnknown> = <
  TStringPath extends StringPath<TFormInput>,
>(
  path: TStringPath,
) => KeckFieldForPath<TFormInput, TStringPath>;

export type GetFieldFn<TFormInput extends ObjectOrUnknown> = GetFormFieldFn<TFormInput>;

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

export type KeckFieldForPath<
  TFormInput extends ObjectOrUnknown,
  TStringPath extends StringPath<TFormInput>,
> = TFormInput extends object
  ? ValueAtPath<TFormInput, TStringPath> extends Array<infer _TFieldType>
    ? KeckFieldArray<TFormInput, TStringPath>
    : ValueAtPath<TFormInput, TStringPath> extends object
      ? KeckFieldObject<TFormInput, TStringPath>
      : KeckField<TFormInput, TStringPath>
  : unknown;
