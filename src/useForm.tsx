import { useObserver } from 'keck/react';
import type React from 'react';
import { Fragment } from 'react';
import { useRef } from 'react';
import {
  type FormValidatorFn,
  KeckForm,
  type OnSubmitAttemptFn,
  type OnSubmitFn,
  reassignOptions,
  stateAccessor,
} from './KeckForm';
import type { ObjectOrUnknown } from './types';
import { keckFormContext, useFormContext } from './useFormContext';

export type UseFormReturn<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> = {
  form: KeckForm<TFormInput, TFormOutput>;
  FormProvider: React.FC<{ children: React.ReactNode | React.ReactNode[] }>;
};

export function useForm<
  TFormInput extends object,
  TFormOutput extends object = TFormInput,
>(options: {
  tryContext?: boolean;
  initial: TFormInput;
  validate: FormValidatorFn<TFormInput, TFormOutput>;
  onSubmit?: OnSubmitFn<TFormOutput>;
  onSubmitAttempt?: OnSubmitAttemptFn;
}): UseFormReturn<TFormInput, TFormOutput> {
  const context = useFormContext<TFormInput, TFormOutput>(true);
  const contextFormReturn =
    options.tryContext && context ? { form: context, FormProvider: Fragment } : null;

  const formRef = useRef<UseFormReturn<TFormInput, TFormOutput>>(contextFormReturn);

  if (!formRef.current) {
    const form = new KeckForm<TFormInput, TFormOutput>({
      initial: options.initial,
      validate: options.validate,
      onSubmit: options.onSubmit,
      onSubmitAttempt: options.onSubmitAttempt,
    });
    const typedContext = keckFormContext as React.Context<KeckForm<TFormInput, TFormOutput> | null>;
    formRef.current = {
      form,
      FormProvider: ({ children }) => {
        return <typedContext.Provider value={form}>{children}</typedContext.Provider>;
      },
    };
  }

  formRef.current.form[reassignOptions](options);
  formRef.current.form[stateAccessor] = useObserver(formRef.current.form[stateAccessor]);

  return formRef.current;
}
