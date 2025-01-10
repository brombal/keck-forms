import type React from 'react';
import { createContext } from 'react';
import { KeckForm } from './KeckForm';
import type { FormValidatorFn, GetFieldFn, ObjectOrUnknown } from './types';

export type UseFormReturn<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> = {
  form: KeckForm<TFormInput, TFormOutput>;
  field: GetFieldFn<TFormInput>;
  FormProvider: React.FC<{ children: React.ReactNode[] }>;
};

export const keckFormContext = createContext<KeckForm<unknown, unknown> | null>(null);

export function useForm<TFormInput extends object, TFormOutput extends object>(options: {
  initial: TFormInput;
  validate: FormValidatorFn<TFormInput, TFormOutput>;
}): UseFormReturn<TFormInput, TFormOutput> {
  const form = new KeckForm<TFormInput, TFormOutput>({
    initial: options.initial,
    validate: options.validate,
  });

  const typedContext = keckFormContext as React.Context<KeckForm<TFormInput, TFormOutput> | null>;

  return {
    form,
    field: form.field,
    FormProvider: ({ children }) => {
      return <typedContext.Provider value={form}>{children}</typedContext.Provider>;
    },
  };
}
