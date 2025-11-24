import type { UseFormReturn } from 'keck-forms/useForm';
import type { Get, LiteralUnion, Paths } from 'type-fest';

type ToString<T> = T extends string | number ? `${T}` : never;

/**
 * Like Get from type-fest, but with support for a empty path ('') that references the root value.
 */
export type GetWithRoot<
  BaseType,
  Path extends LiteralUnion<
    ToString<Paths<BaseType, { bracketNotation: false; maxRecursionDepth: 2 }>>,
    string
  >,
> = Path extends '' ? BaseType : Get<BaseType, Path, { strict: false }>;

export type StringPaths<T> = T extends object ? Extract<Paths<T>, string> | '' : string;

export type ObjectOrUnknown = object | unknown;

/**
 * Takes a UseFormReturn and extracts the TFormInput type.
 */
export type FormInputType<T> = T extends UseFormReturn<infer TFormInput, infer _TFormOutput>
  ? TFormInput
  : never;

/**
 * Takes a UseFormReturn and extracts the TFormOutput type.
 */
export type FormOutputType<T> = T extends UseFormReturn<infer _TFormInput, infer TFormOutput>
  ? TFormOutput
  : never;
