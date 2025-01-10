import { useContext } from 'react';
import type { KeckForm } from './KeckForm';
import type { GetFormFieldFn, ObjectOrUnknown } from './types';
import { keckFormContext } from './useForm';

export type UseFormContextReturn<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
> = {
  form: KeckForm<TFormInput, TFormOutput>;
  field: GetFormFieldFn<TFormInput>;
};

export function useFormContext<
  TFormInput extends ObjectOrUnknown = unknown,
  TFormOutput extends ObjectOrUnknown = unknown,
>(): UseFormContextReturn<TFormInput, TFormOutput> {
  const form = useContext(keckFormContext) as KeckForm<TFormInput, TFormOutput>;
  if (!form) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return {
    form: form,
    field: form.field,
  };
}
