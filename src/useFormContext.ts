import { useObserver } from 'keck/react';
import { createContext, useContext } from 'react';
import type { KeckForm } from './KeckForm';
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

  return useObserver(form);
}
