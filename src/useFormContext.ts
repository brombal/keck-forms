import { useObserver } from 'keck/react';
import { createContext, useContext, useRef } from 'react';
import { KeckForm, type KeckFormOptionsInternal, stateAccessor } from './KeckForm';
import type { ObjectOrUnknown } from './types';

export const keckFormContext = createContext<KeckForm<unknown, unknown> | null>(null);

export function useFormContext<
  TFormInput extends ObjectOrUnknown = unknown,
  TFormOutput extends ObjectOrUnknown = unknown,
>(dontThrowOnMissingProvider: true): KeckForm<TFormInput, TFormOutput> | null;

export function useFormContext<
  TFormInput extends ObjectOrUnknown = unknown,
  TFormOutput extends ObjectOrUnknown = unknown,
>(dontThrowOnMissingProvider?: false): KeckForm<TFormInput, TFormOutput>;

export function useFormContext<
  TFormInput extends ObjectOrUnknown = unknown,
  TFormOutput extends ObjectOrUnknown = unknown,
>(dontThrowOnMissingProvider = false): KeckForm<TFormInput, TFormOutput> | null {
  const form = useContext(keckFormContext) as KeckForm<TFormInput, TFormOutput> | undefined;
  if (!form) {
    if (!dontThrowOnMissingProvider)
      throw new Error('useFormContext must be used within a FormProvider.');
    return null;
  }

  // NOTE: It is an invariant error (i.e. a developer mistake) to change the value of `throwOnMissingProvider` or
  // whether this hook is called from inside a FormProvider at runtime, because it changes the number of hooks that
  // are called.

  const state = useObserver(form?.[stateAccessor]);

  const formRef = useRef<KeckForm<TFormInput, TFormOutput>>(null);
  if (!formRef.current) {
    formRef.current = new KeckForm({ form, state } as KeckFormOptionsInternal<
      TFormInput,
      TFormOutput
    >);
  }

  return formRef.current;
}
