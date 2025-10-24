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

export function useForm<TFormInput extends object, TFormOutput extends object = TFormInput>(
  options: {
    tryContext?: boolean;
    initial: TFormInput;
    validate?: FormValidatorFn<NoInfer<TFormInput>, TFormOutput>;
    onSubmit?: OnSubmitFn<TFormOutput>;
    onSubmitAttempt?: OnSubmitAttemptFn;
  },
  deps?: any[],
): UseFormReturn<TFormInput, TFormOutput> {
  const context = useFormContext<TFormInput, TFormOutput>(true);
  const contextFormReturn =
    options.tryContext && context ? { form: context, FormProvider: Fragment } : null;

  const formRef = useRef<UseFormReturn<TFormInput, TFormOutput>>(contextFormReturn);

  const previousDepsRef = useRef<any[] | undefined>(undefined);
  const depsChanged =
    !!deps?.length &&
    (!previousDepsRef.current ||
      deps.length !== previousDepsRef.current.length ||
      deps.some((dep, index) => dep !== previousDepsRef.current?.[index]));

  if (depsChanged) {
    previousDepsRef.current = deps;
  }

  if (depsChanged || !formRef.current) {
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

  const form = useObserver(formRef.current.form, [formRef.current.form]);
  form[reassignOptions](options);

  return {
    form,
    FormProvider: formRef.current.FormProvider,
  };
}
