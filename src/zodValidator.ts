import type { z } from 'zod';
import type { FormValidatorFn } from './KeckForm';
import type { ObjectOrUnknown, StringPaths } from './types';

/**
 * Creates a FormValidatorFn from a zod schema. By default the validator's input type is the
 * schema's input type; pass TFormInput explicitly when the form state is intentionally wider than
 * the schema input (the validator safeParses any value at runtime, so this is always safe).
 *
 * @deprecated Use the `schema` form option or `standardSchemaValidator` instead — zod >= 3.24
 * implements the Standard Schema interface, and both provide the same behavior and typing
 * (including the input-widening TFormInput parameter). zodValidator will be removed in
 * keck-forms 4.
 */
export const zodValidator = <
  TSchema extends z.Schema<any>,
  TFormInput extends ObjectOrUnknown = z.input<TSchema>,
>(
  schema: TSchema,
): FormValidatorFn<TFormInput, z.output<TSchema>> => {
  return (values, setError) => {
    const result = schema.safeParse(values);
    if (result.success) return result.data;

    for (const error of result.error.errors) {
      const path = error.path.join('.');
      setError(path as StringPaths<TFormInput>, error.message);
    }

    return null;
  };
};
