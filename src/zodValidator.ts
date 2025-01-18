import type { z } from 'zod';
import type { FormValidatorFn } from './KeckForm';
import type { StringPath } from './types';

export const zodValidator = <TSchema extends z.Schema<any>>(
  schema: TSchema,
): FormValidatorFn<z.input<TSchema>, z.output<TSchema>> => {
  return (values, setError) => {
    const result = schema.safeParse(values);
    if (result.success) return result.data;

    for (const error of result.error.errors) {
      const path = error.path.join('.');
      setError(path as StringPath<z.input<TSchema>>, error.message);
    }

    return null;
  };
};
