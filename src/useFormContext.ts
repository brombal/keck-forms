import { useObserver } from 'keck/react';
import { useContext, useRef } from 'react';
import { KeckForm, type KeckFormOptionsInternal } from './KeckForm';
import type { ObjectOrUnknown } from './types';
import { keckFormContext } from './useForm';

export function useFormContext<
  TFormInput extends ObjectOrUnknown = unknown,
  TFormOutput extends ObjectOrUnknown = unknown,
>(): KeckForm<TFormInput, TFormOutput> {
  const form = useContext(keckFormContext) as KeckForm<TFormInput, TFormOutput>;
  if (!form) {
    throw new Error('useFormContext must be used within a FormProvider.');
  }

  const state = useObserver(form.state);

  const formRef = useRef<KeckForm<TFormInput, TFormOutput>>(null);
  if (!formRef.current) {
    formRef.current = new KeckForm({ state } as KeckFormOptionsInternal<TFormInput, TFormOutput>);
  }

  return formRef.current;
}
