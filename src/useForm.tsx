import type React from 'react';
import { useRef } from 'react';
import { createContext } from 'react';
import { type FormValidatorFn, KeckForm } from './KeckForm';
import type { ObjectOrUnknown } from './types';

export type UseFormReturn<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> = {
  form: KeckForm<TFormInput, TFormOutput>;
  FormProvider: React.FC<{ children: React.ReactNode | React.ReactNode[] }>;
};

export const keckFormContext = createContext<KeckForm<unknown, unknown> | null>(null);

export function useForm<TFormInput extends object, TFormOutput extends object>(options: {
  initial: TFormInput;
  validate: FormValidatorFn<TFormInput, TFormOutput>;
}): UseFormReturn<TFormInput, TFormOutput> {
  const formRef = useRef<UseFormReturn<TFormInput, TFormOutput>>(null);

  if (!formRef.current) {
    const form = new KeckForm<TFormInput, TFormOutput>({
      initial: options.initial,
      validate: options.validate,
    });
    const typedContext = keckFormContext as React.Context<KeckForm<TFormInput, TFormOutput> | null>;
    formRef.current = {
      form,
      FormProvider: ({ children }) => {
        return <typedContext.Provider value={form}>{children}</typedContext.Provider>;
      },
    };
  }

  return formRef.current;
}
