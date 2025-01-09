import type { FormValidatorFn, GetFieldFn } from 'keck-forms/types';
import type React from 'react';

export declare function useForm<TInput extends object, TOutput>(options: {
  initial: TInput;
  validate: FormValidatorFn<TInput, TOutput>;
}): {
  form: TOutput;
  field: GetFieldFn<TInput>;
  FormProvider: React.FC<{ children: React.ReactNode[] }>;
};
