import { useObserver } from 'keck/react';
import type React from 'react';
import { Fragment, useMemo, useRef } from 'react';
import { FormProvider } from './FormProvider';
import {
  type FormValidatorFn,
  KeckForm,
  type OnSubmitAttemptFn,
  type OnSubmitFn,
  reassignOptions,
} from './KeckForm';
import type { StandardSchemaV1 } from './standardSchema';
import type { ObjectOrUnknown } from './types';
import { useFormContext } from './useFormContext';

export type UseFormReturn<
  TFormInput extends ObjectOrUnknown,
  TFormOutput extends ObjectOrUnknown,
  TMeta extends object = Record<string, unknown>,
> = {
  form: KeckForm<TFormInput, TFormOutput, TMeta>;
  FormProvider: React.FC<{ children: React.ReactNode | React.ReactNode[] }>;
};

/*
 * useForm's overloads are designed so callers provide as few explicit types as possible; the
 * inference source depends on which options are given:
 *
 * 1. `schema` (a Standard Schema, e.g. zod/valibot/arktype): the form input/output types come
 *    from the schema, and `initial` must *satisfy* (be assignable to, not exactly equal) the
 *    schema's input type.
 * 2. `validate` (a FormValidatorFn, e.g. from zodValidator): the form input/output types come
 *    from the validator function's type, with the same satisfies-semantics for `initial`. If the
 *    validator's type doesn't determine the input type (a zero-param stub, or an inline function
 *    with an unannotated parameter), the input type falls back to `initial`'s type: `initial` is
 *    declared as `TFormInput & {}`, a LOW-priority inference site, so its candidate is used only
 *    when the validator contributes none. Do not "simplify" the `& {}` away — it is load-bearing.
 *    NOTE (TS limitation): if `validate` is an *inline generic call* (e.g.
 *    `validate: zodValidator(schema)`) AND the options object also contains a context-sensitive
 *    member (an unannotated `onSubmit(output)`), TypeScript defers the whole object during
 *    inference and the validator cannot drive the types (you get a loud error on the validate
 *    line). Hoist the validator to a const, annotate onSubmit's parameter, or use the `schema`
 *    option (a plain property never defers).
 * 3. Neither: types come from `initial`; the output type defaults to the input type, and can be
 *    set by an annotated onSubmit parameter or explicit type arguments.
 */

export function useForm<
  TSchema extends StandardSchemaV1<object, object>,
  TMeta extends object = Record<string, unknown>,
>(
  options: {
    tryContext?: boolean;
    initial:
      | NoInfer<StandardSchemaV1.InferInput<TSchema>>
      | (() => NoInfer<StandardSchemaV1.InferInput<TSchema>>);
    schema: TSchema;
    validate?: undefined;
    onSubmit?: OnSubmitFn<
      StandardSchemaV1.InferInput<TSchema>,
      StandardSchemaV1.InferOutput<TSchema>
    >;
    onSubmitAttempt?: OnSubmitAttemptFn;
    meta?: TMeta;
  },
  deps?: any[],
): UseFormReturn<
  StandardSchemaV1.InferInput<TSchema>,
  StandardSchemaV1.InferOutput<TSchema>,
  TMeta
>;

export function useForm<
  TFormInput extends object,
  TFormOutput extends object = TFormInput,
  TMeta extends object = Record<string, unknown>,
>(
  options: {
    tryContext?: boolean;
    initial: (TFormInput & {}) | (() => TFormInput & {});
    schema?: undefined;
    validate?: FormValidatorFn<TFormInput, TFormOutput>;
    onSubmit?: OnSubmitFn<TFormInput, TFormOutput>;
    onSubmitAttempt?: OnSubmitAttemptFn;
    meta?: TMeta;
  },
  deps?: any[],
): UseFormReturn<TFormInput, TFormOutput, TMeta>;

export function useForm<
  TFormInput extends object,
  TFormOutput extends object = TFormInput,
  TMeta extends object = Record<string, unknown>,
>(
  options: {
    tryContext?: boolean;
    initial: TFormInput | (() => TFormInput);
    schema?: StandardSchemaV1<any, any>;
    validate?: FormValidatorFn<any, any>;
    onSubmit?: OnSubmitFn<any, any>;
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
      schema: options.schema,
      onSubmit: options.onSubmit,
      onSubmitAttempt: options.onSubmitAttempt,
      meta: options.meta,
    });
    formRef.current = {
      form,
      FormProvider: ({ children }) => <FormProvider form={form}>{children}</FormProvider>,
    };
  }

  const form = useObserver(formRef.current.form, [formRef.current.form]);
  form[reassignOptions]({
    validate: options.validate,
    schema: options.schema,
    initial,
    onSubmit: options.onSubmit,
    onSubmitAttempt: options.onSubmitAttempt,
  });

  return {
    form,
    FormProvider: formRef.current.FormProvider,
  };
}
