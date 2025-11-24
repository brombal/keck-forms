import type { z } from 'zod';
import type { FormValidatorFn } from './KeckForm';
import type { StringPaths } from './types';

export const zodValidator = <TSchema extends z.Schema<any>>(
  schema: TSchema,
): TSchema extends z.Schema ? FormValidatorFn<any, z.output<TSchema>> : never => {
  return ((values, setError) => {
    const result = schema.safeParse(values);
    if (result.success) return result.data;

    for (const error of result.error.errors) {
      const path = error.path.join('.');
      setError(path as StringPaths<z.input<TSchema>>, error.message);
    }

    return null;
  }) as TSchema extends z.Schema ? FormValidatorFn<any, z.output<TSchema>> : never;
};
