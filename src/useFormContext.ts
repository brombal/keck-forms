import type { GetFieldFn } from 'keck-forms/types';

export declare function useFormContext<
  TFormInput extends object | unknown = unknown,
  TFormOutput = unknown,
>(): {
  form: TFormOutput;
  field: GetFieldFn<TFormInput>;
};
