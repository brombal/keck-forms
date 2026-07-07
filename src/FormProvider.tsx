import type React from 'react';
import type { KeckForm } from './KeckForm';
import type { ObjectOrUnknown } from './types';
import { keckFormContext } from './useFormContext';

/**
 * Provides an existing KeckForm instance to descendant components (`useFormContext` and
 * field-bound inputs).
 *
 * Use this when the form is created outside React — e.g. by a plain factory, store, or
 * controller object that calls `new KeckForm(...)` directly. Forms created with `useForm` don't
 * need this: `useForm` returns its own `FormProvider`, pre-bound to the form it created.
 */
export function FormProvider<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
  TMeta extends object = Record<string, unknown>,
>(props: {
  form: KeckForm<TFormInput, TFormOutput, TMeta>;
  children: React.ReactNode | React.ReactNode[];
}) {
  return (
    <keckFormContext.Provider value={props.form as KeckForm<unknown, unknown>}>
      {props.children}
    </keckFormContext.Provider>
  );
}
