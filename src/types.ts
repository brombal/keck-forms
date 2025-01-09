import type { KeckField } from 'keck-forms/KeckField';
import type { KeckFieldArray } from 'keck-forms/KeckFieldArray';
import type { KeckFieldObject } from 'keck-forms/KeckFieldObject';

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

export type GetFieldFn<TFormInput extends object | unknown> = TFormInput extends object
  ? <TStringPath extends StringPath<TFormInput>>(
      path: TStringPath,
    ) => KeckFieldForPath<TFormInput, TStringPath>
  : <TFieldType>(path: string) => TypedKeckField<TFieldType>;

export type FormValidatorFn<TInput extends object, TOutput> = (
  input: TInput,
  setError: (
    field: StringPath<TInput>,
    error: string | null | undefined | false,
    action?: 'push' | 'unshift' | 'replace',
  ) => void,
) => TOutput;

export interface TypedKeckField<TValue = unknown> {
  path: string;
  value: TValue;
  touched: boolean;
  readonly errors: string[];
  readonly dirty: boolean;
}

export type KeckFieldForPath<
  TFormInput extends object,
  TStringPath extends StringPath<TFormInput>,
> = ValueAtPath<TFormInput, TStringPath> extends Array<infer _TFieldType>
  ? KeckFieldArray<TFormInput, TStringPath>
  : ValueAtPath<TFormInput, TStringPath> extends object
    ? KeckFieldObject<TFormInput, TStringPath>
    : KeckField<TFormInput, TStringPath>;
