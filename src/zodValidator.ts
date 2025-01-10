import type { z } from 'zod';
import type { FormValidatorFn, StringPath } from './types';

export const zodValidator = <TInput extends object, TOutput extends object>(
  schema: z.Schema<TOutput>,
): FormValidatorFn<TInput, TOutput> => {
  return (values, setError) => {
    const result = schema.safeParse(values);
    if (result.success) return result.data;

    for (const error of result.error.errors) {
      const path = error.path.join('.');
      setError(path as StringPath<TInput>, error.message);
    }

    return null;
  };
};
