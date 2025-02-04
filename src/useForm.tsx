import { useObserver } from 'keck/react';
import type React from 'react';
import { type HTMLProps, useRef } from 'react';
import { createContext } from 'react';
import { type FormValidatorFn, KeckForm, state } from './KeckForm';
import type { ObjectOrUnknown } from './types';

export type UseFormReturn<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> = {
  form: KeckForm<TFormInput, TFormOutput>;
  FormProvider: React.FC<
    HTMLProps<HTMLFormElement> & { children: React.ReactNode | React.ReactNode[] }
  >;
};

export const keckFormContext = createContext<KeckForm<unknown, unknown> | null>(null);

export function useForm<TFormInput extends object, TFormOutput extends object>(options: {
  initial: TFormInput;
  validate: FormValidatorFn<TFormInput, TFormOutput>;
  onSubmit?: (output: TFormOutput | null) => void;
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
      FormProvider: ({ children, ...props }) => {
        return (
          <typedContext.Provider value={form}>
            {options.onSubmit ? (
              <form
                {...props}
                onSubmit={(e) => {
                  e.preventDefault();
                  const output = form.validate();
                  options.onSubmit!(output);
                }}
              >
                {children}
              </form>
            ) : (
              children
            )}
          </typedContext.Provider>
        );
      },
    };
  }

  formRef.current.form[state] = useObserver(formRef.current.form[state]);

  return formRef.current;
}
