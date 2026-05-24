import { useObserver } from 'keck/react';
import type React from 'react';
import { Fragment, useMemo, useRef } from 'react';
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
  TMeta extends object = Record<string, unknown>,
> = {
  form: KeckForm<TFormInput, TFormOutput, TMeta>;
  FormProvider: React.FC<{ children: React.ReactNode | React.ReactNode[] }>;
};

export function useForm<
  TFormInput extends object,
  TFormOutput extends object = TFormInput,
  TMeta extends object = Record<string, unknown>,
>(
  options: {
    tryContext?: boolean;
    initial: TFormInput | (() => TFormInput);
    validate?: FormValidatorFn<NoInfer<TFormInput>, TFormOutput>;
    onSubmit?: OnSubmitFn<TFormInput, TFormOutput>;
    onSubmitAttempt?: OnSubmitAttemptFn;
    meta?: TMeta;
  },
  deps?: any[],
): UseFormReturn<TFormInput, TFormOutput, TMeta> {
  const context = useFormContext<TFormInput, TFormOutput>(true);
  const contextFormReturn =
    options.tryContext && context
      ? { form: context as KeckForm<TFormInput, TFormOutput, TMeta>, FormProvider: Fragment }
      : null;

  const formRef = useRef<UseFormReturn<TFormInput, TFormOutput, TMeta>>(contextFormReturn);

  const previousDepsRef = useRef<any[] | undefined>(undefined);
  const depsChanged =
    !!deps?.length &&
    (!previousDepsRef.current ||
      deps.length !== previousDepsRef.current.length ||
      deps.some((dep, index) => dep !== previousDepsRef.current?.[index]));

  if (depsChanged) {
    previousDepsRef.current = deps;
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: dependency is managed manually
  const initial = useMemo(() => {
    return typeof options.initial === 'function'
      ? (options.initial as () => TFormInput)()
      : options.initial;
  }, [typeof options.initial === 'function' ? undefined : options.initial, ...(deps || [])]);

  if (depsChanged || !formRef.current) {
    const form = new KeckForm<TFormInput, TFormOutput, TMeta>({
      initial,
      validate: options.validate,
      onSubmit: options.onSubmit,
      onSubmitAttempt: options.onSubmitAttempt,
      meta: options.meta,
    });
    const typedContext = keckFormContext as React.Context<KeckForm<
      TFormInput,
      TFormOutput,
      TMeta
    > | null>;
    formRef.current = {
      form,
      FormProvider: ({ children }) => {
        return <typedContext.Provider value={form}>{children}</typedContext.Provider>;
      },
    };
  }

  const form = useObserver(formRef.current.form, [formRef.current.form]);
  form[reassignOptions]({
    validate: options.validate,
    initial,
    onSubmit: options.onSubmit,
    onSubmitAttempt: options.onSubmitAttempt,
  });

  return {
    form,
    FormProvider: formRef.current.FormProvider,
  };
}
