import type { FormValidatorFn } from './KeckForm';
import type { StandardSchemaV1 } from './standardSchema';
import type { ObjectOrUnknown, StringPaths } from './types';

/**
 * Creates a FormValidatorFn from any Standard Schema (https://standardschema.dev) — e.g. a zod
 * (>= 3.24), valibot, or arktype schema. This is what the `schema` form option uses internally.
 *
 * By default the validator's input type is the schema's input type; pass TFormInput explicitly
 * when the form state is intentionally wider than the schema input (the validator passes any
 * value to the schema at runtime, so this is always safe).
 *
 * Async validation is not supported: a schema whose validate function returns a Promise (e.g. a
 * zod schema with async refinements) throws when the form validates.
 */
export const standardSchemaValidator = <
  TSchema extends StandardSchemaV1,
  TFormInput extends ObjectOrUnknown = StandardSchemaV1.InferInput<TSchema>,
>(
  schema: TSchema,
): FormValidatorFn<TFormInput, StandardSchemaV1.InferOutput<TSchema>> => {
  return (values, setError) => {
    const result = schema['~standard'].validate(values);
    if (result instanceof Promise) {
      throw new Error(
        'keck-forms: async validation is not supported (the schema returned a Promise)',
      );
    }
    if (!result.issues) return result.value;

    for (const issue of result.issues) {
      const path = (issue.path ?? [])
        .map((segment) =>
          String(typeof segment === 'object' && segment !== null ? segment.key : segment),
        )
        .join('.');
      setError(path as StringPaths<TFormInput>, issue.message);
    }

    return null;
  };
};
