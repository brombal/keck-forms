import type { FormValidatorFn } from 'keck-forms/types';
import { set } from 'lodash-es';
import type { z } from 'zod';

export declare function zodValidator(schema: z.Schema<any>): FormValidatorFn<any, any>;

export function zodValidatorX<TValues extends object>(schema: z.ZodType<any, any>) {
  return ((values: TValues): Errors<string> | null => {
    if (!schema) return null;

    const res = (schema as z.ZodSchema).safeParse(values);
    if (res.success) return null;

    const errors = {} as Errors<string>;
    for (const error of res.error.issues) {
      const path = error.path?.length ? error.path.join('.') : '';
      const existing = errors[path];
      if (Array.isArray(existing)) {
        existing.push(error.message);
      } else if (!existing) {
        set(errors, path, [error.message]);
      }
      // If `existing` exists but is not an array, well then i don't know what to do
    }
    return errors;
  }) as ValidateFn<TValues, string>;
}
