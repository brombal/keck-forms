import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';
import { Paths, LiteralUnion, Get, IsNever, IsUnknown } from 'type-fest';
import { z } from 'zod';

/**
 * The Standard Schema interface (https://standardschema.dev) — a common interface implemented by
 * validation libraries including zod (>= 3.24), valibot (>= 1.0), and arktype (>= 2.0).
 *
 * These types are vendored (copied) from @standard-schema/spec, as the spec recommends for
 * consuming libraries: the interface is small, stable (versioned by the `version` property), and
 * copying it avoids imposing a dependency on consumers. Do not modify — it must remain
 * structurally identical to the published spec so that implementing libraries match.
 */
interface StandardSchemaV1<Input = unknown, Output = Input> {
    /** The Standard Schema properties. */
    readonly '~standard': StandardSchemaV1.Props<Input, Output>;
}
declare namespace StandardSchemaV1 {
    /** The Standard Schema properties interface. */
    interface Props<Input = unknown, Output = Input> {
        /** The version number of the standard. */
        readonly version: 1;
        /** The vendor name of the schema library. */
        readonly vendor: string;
        /** Validates unknown input values. */
        readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>;
        /** Inferred types associated with the schema. */
        readonly types?: Types<Input, Output> | undefined;
    }
    /** The result interface of the validate function. */
    type Result<Output> = SuccessResult<Output> | FailureResult;
    /** The result interface if validation succeeds. */
    interface SuccessResult<Output> {
        /** The typed output value. */
        readonly value: Output;
        /** The non-existent issues. */
        readonly issues?: undefined;
    }
    /** The result interface if validation fails. */
    interface FailureResult {
        /** The issues of failed validation. */
        readonly issues: ReadonlyArray<Issue>;
    }
    /** The issue interface of the failure output. */
    interface Issue {
        /** The error message of the issue. */
        readonly message: string;
        /** The path of the issue, if any. */
        readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
    }
    /** The path segment interface of the issue. */
    interface PathSegment {
        /** The key representing a path segment. */
        readonly key: PropertyKey;
    }
    /** The Standard Schema types interface. */
    interface Types<Input = unknown, Output = Input> {
        /** The input type of the schema. */
        readonly input: Input;
        /** The output type of the schema. */
        readonly output: Output;
    }
    /** Infers the input type of a Standard Schema. */
    type InferInput<Schema extends StandardSchemaV1> = NonNullable<Schema['~standard']['types']>['input'];
    /** Infers the output type of a Standard Schema. */
    type InferOutput<Schema extends StandardSchemaV1> = NonNullable<Schema['~standard']['types']>['output'];
}

type UseFormReturn<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown, TMeta extends object = Record<string, unknown>> = {
    form: KeckForm<TFormInput, TFormOutput, TMeta>;
    FormProvider: React.FC<{
        children: React.ReactNode | React.ReactNode[];
    }>;
};
declare function useForm<TSchema extends StandardSchemaV1<object, object>, TMeta extends object = Record<string, unknown>>(options: {
    tryContext?: boolean;
    initial: NoInfer<StandardSchemaV1.InferInput<TSchema>> | (() => NoInfer<StandardSchemaV1.InferInput<TSchema>>);
    schema: TSchema;
    validate?: undefined;
    onSubmit?: OnSubmitFn<StandardSchemaV1.InferInput<TSchema>, StandardSchemaV1.InferOutput<TSchema>>;
    onSubmitAttempt?: OnSubmitAttemptFn;
    meta?: TMeta;
}, deps?: any[]): UseFormReturn<StandardSchemaV1.InferInput<TSchema>, StandardSchemaV1.InferOutput<TSchema>, TMeta>;
declare function useForm<TFormInput extends object, TFormOutput extends object = TFormInput, TMeta extends object = Record<string, unknown>>(options: {
    tryContext?: boolean;
    initial: (TFormInput & {}) | (() => TFormInput & {});
    schema?: undefined;
    validate?: FormValidatorFn<TFormInput, TFormOutput>;
    onSubmit?: OnSubmitFn<TFormInput, TFormOutput>;
    onSubmitAttempt?: OnSubmitAttemptFn;
    meta?: TMeta;
}, deps?: any[]): UseFormReturn<TFormInput, TFormOutput, TMeta>;

type ToString<T> = T extends string | number ? `${T}` : never;
/**
 * Like Get from type-fest, but with support for a empty path ('') that references the root value.
 */
type GetWithRoot<BaseType, Path extends LiteralUnion<ToString<Paths<BaseType, {
    bracketNotation: false;
    maxRecursionDepth: 2;
}>>, string>> = Path extends '' ? BaseType : Get<BaseType, Path, {
    strict: false;
}>;
type StringPaths<T> = T extends object ? Extract<Paths<T>, string> | '' : string;
type ObjectOrUnknown = object | unknown;
/**
 * Takes a UseFormReturn and extracts the TFormInput type.
 */
type FormInputType<T> = T extends UseFormReturn<infer TFormInput, infer _TFormOutput> ? TFormInput : never;
/**
 * Takes a UseFormReturn and extracts the TFormOutput type.
 */
type FormOutputType<T> = T extends UseFormReturn<infer _TFormInput, infer TFormOutput> ? TFormOutput : never;
/**
 * Takes a UseFormReturn and extracts the TMeta type.
 */
type FormMetaType<T> = T extends UseFormReturn<infer _TFormInput, infer _TFormOutput, infer TMeta> ? TMeta : never;

declare class KeckFieldArray<TFormInput extends object, TStringPath extends string> extends KeckFieldBase<TFormInput, TStringPath> {
    field<TPath extends string>(_path: TPath): `${TStringPath}.${TPath}` extends StringPaths<TFormInput> ? KeckFieldForPath<TFormInput, `${TStringPath}.${TPath}` extends StringPaths<TFormInput> ? `${TStringPath}.${TPath}` : never> : never;
    /**
     * Maps each field in the array to a new value by invoking the callback function.
     */
    map<TReturn>(callback: (field: KeckFieldForPath<TFormInput, `${TStringPath}.${number}` extends StringPaths<TFormInput> ? `${TStringPath}.${number}` : never>, index: number) => TReturn): TReturn[];
    get allErrors(): Array<{
        path: string;
        errors: string[];
    }>;
    private _touchedArray;
    private _cleanupTouched;
    push(value: Get<TFormInput, `${TStringPath}.${number}`>): void;
    pop(): Get<TFormInput, `${TStringPath}.${number}`> | undefined;
    remove(index: number): void;
    shift(): Get<TFormInput, `${TStringPath}.${number}`> | undefined;
    unshift(value: Get<TFormInput, `${TStringPath}.${number}`>): void;
    swap(indexA: number, indexB: number): void;
    insert(index: number, value: Get<TFormInput, `${TStringPath}.${number}`>): void;
    clear(): void;
}

declare class KeckFieldObject<TFormInput extends object, TStringPath extends string> extends KeckFieldBase<TFormInput, TStringPath> {
    field<TPath extends string>(_path: TPath): `${TStringPath}.${TPath}` extends StringPaths<TFormInput> ? KeckFieldForPath<TFormInput, `${TStringPath}.${TPath}` extends StringPaths<TFormInput> ? `${TStringPath}.${TPath}` : never> : never;
    get allErrors(): Array<{
        path: string;
        errors: string[];
    }>;
}

type KeckFieldForPath<TFormInput extends ObjectOrUnknown, TStringPath extends StringPaths<TFormInput>> = TStringPath extends string ? TFormInput extends object ? GetWithRoot<TFormInput, TStringPath> extends Array<infer _TFieldType> ? KeckFieldArray<TFormInput, TStringPath> : GetWithRoot<TFormInput, TStringPath> extends object ? KeckFieldObject<TFormInput, TStringPath> : KeckField<TFormInput, TStringPath> : never : never;
/**
 * Used to represent a KeckField with an explicit type (instead of inferring a type from a form input structure
 * and a string path).
 */
type TypedKeckField<TType> = Omit<KeckFieldBase<unknown, ''>, 'value'> & {
    value: TType;
};
declare abstract class KeckFieldBase<TFormInput extends ObjectOrUnknown, TStringPath extends string> {
    readonly form: KeckForm<TFormInput, unknown>;
    readonly path: TStringPath;
    constructor(form: KeckForm<TFormInput, unknown>, path: TStringPath);
    get value(): TFormInput extends object ? GetWithRoot<TFormInput, TStringPath> : 5;
    set value(value: GetWithRoot<TFormInput, TStringPath>);
    get dirty(): boolean;
    get touched(): boolean;
    set touched(value: boolean);
    get errors(): string[];
    get allErrors(): Array<{
        path: string;
        errors: string[];
    }>;
    get isValid(): boolean;
    reset(): void;
}
declare class KeckField<TFormInput extends ObjectOrUnknown, TStringPath extends string> extends KeckFieldBase<TFormInput, TStringPath> {
}

declare const $values: unique symbol;
declare const $errors: unique symbol;
declare const $touched: unique symbol;

type FormValidatorFn<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> = (input: TFormInput, setError: (field: StringPaths<TFormInput>, error: string | null | undefined | false, action?: 'push' | 'unshift' | 'replace') => void) => TFormOutput | null;
type OnSubmitFn<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> = (output: TFormOutput, form: KeckForm<TFormInput, TFormOutput>) => Promise<void> | void;
type OnSubmitAttemptFn = () => Promise<void> | void;
/**
 * The public interface for the KeckForm class constructor parameters.
 */
type KeckFormOptions<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown, TMeta extends object = Record<string, unknown>> = {
    initial: TFormInput;
    validate?: FormValidatorFn<TFormInput, TFormOutput>;
    /**
     * A Standard Schema (https://standardschema.dev) used to validate the form — e.g. a zod
     * (>= 3.24), valibot, or arktype schema. Ignored if `validate` is provided. Async schemas are
     * not supported (validation throws if the schema returns a Promise).
     */
    schema?: StandardSchemaV1<any, TFormOutput>;
    onSubmit?: OnSubmitFn<TFormInput, TFormOutput>;
    onSubmitAttempt?: OnSubmitAttemptFn;
    meta?: TMeta;
};
declare const reassignOptions: unique symbol;
/**
 * A KeckForm object represents the entire state of a form.
 */
declare class KeckForm<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown = TFormInput, TMeta extends object = Record<string, unknown>> {
    initial: TFormInput;
    meta: TMeta;
    [$values]: TFormInput;
    [$touched]: any;
    [$errors]: Record<string, string[]>;
    private _output;
    private _isSubmitting;
    private _submitCount;
    private _submitAttemptCount;
    private _submitError;
    private validator?;
    private onSubmit;
    private onSubmitAttempt;
    /**
     * Creates a KeckForm by providing an initial state and a validation function.
     * @param options The initial state and validation function.
     */
    constructor(options: KeckFormOptions<TFormInput, TFormOutput, TMeta>);
    [reassignOptions](options: Partial<KeckFormOptions<TFormInput, TFormOutput>>): void;
    get output(): TFormOutput | null;
    get value(): TFormInput;
    setValues(values: TFormInput): void;
    validate(): TFormOutput | null;
    get isValid(): boolean;
    get dirty(): boolean;
    get touched(): boolean;
    set touched(touched: boolean);
    get errors(): string[];
    get allErrors(): {
        path: string;
        errors: string[];
    }[] | {
        path: string;
        errors: string[];
    }[];
    /**
     * Resets the form state. You can optionally reset specific parts of the form state:
     * - **values** - Reset the values to the initial values.
     * - **touched** - Reset the touched state to null.
     * - **submit** - Reset the submit count and submit attempt count to 0.
     */
    reset(resetOptions?: {
        values?: boolean;
        touched?: boolean;
        submit?: boolean;
    }): void;
    field<TReturn = never, TPath extends string = StringPaths<TFormInput>>(path: IsNever<TReturn> extends true ? TPath & StringPaths<TFormInput> : string): IsNever<TReturn> extends true ? IsUnknown<TFormInput> extends true ? TypedKeckField<unknown> : TPath extends StringPaths<TFormInput> ? KeckFieldForPath<TFormInput, TPath> : never : TypedKeckField<TReturn>;
    private _handleSubmit;
    /**
     * Call this function to submit the form.
     *
     * If the form is valid, the onSubmit function will be called and the submitCount field will be incremented.
     *
     * If the form is not valid, the onSubmitAttempt function will be called and the submitAttemptCount field will be incremented.
     */
    handleSubmit: (e?: any) => Promise<void>;
    get isSubmitting(): boolean;
    get submitCount(): number;
    get submitAttemptCount(): number;
    get submitError(): any;
}

/**
 * Provides an existing KeckForm instance to descendant components (`useFormContext` and
 * field-bound inputs).
 *
 * Use this when the form is created outside React — e.g. by a plain factory, store, or
 * controller object that calls `new KeckForm(...)` directly. Forms created with `useForm` don't
 * need this: `useForm` returns its own `FormProvider`, pre-bound to the form it created.
 */
declare function FormProvider<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown, TMeta extends object = Record<string, unknown>>(props: {
    form: KeckForm<TFormInput, TFormOutput, TMeta>;
    children: React.ReactNode | React.ReactNode[];
}): react_jsx_runtime.JSX.Element;

/**
 * Creates a FormValidatorFn from any Standard Schema (https://standardschema.dev) — e.g. a zod
 * (>= 3.24), valibot, or arktype schema. This is what the `schema` form option uses internally.
 *
 * By default the validator's input type is the schema's input type; pass TFormInput explicitly
 * when the form state is intentionally wider than the schema input (the validator passes any
 * value to the schema at runtime, so this is always safe).
 *
 * Async validation is not supported: a schema whose validate function returns a Promise (e.g. a
 * zod schema with async refinements) throws when the form validates.
 */
declare const standardSchemaValidator: <TSchema extends StandardSchemaV1, TFormInput extends ObjectOrUnknown = StandardSchemaV1.InferInput<TSchema>>(schema: TSchema) => FormValidatorFn<TFormInput, StandardSchemaV1.InferOutput<TSchema>>;

declare function useFormContext<TFormInput extends ObjectOrUnknown = unknown, TFormOutput extends ObjectOrUnknown = unknown>(dontThrowOnMissingProvider: true): KeckForm<TFormInput, TFormOutput> | null;
declare function useFormContext<TFormInput extends ObjectOrUnknown = unknown, TFormOutput extends ObjectOrUnknown = unknown>(dontThrowOnMissingProvider?: false): KeckForm<TFormInput, TFormOutput>;

/**
 * Creates a FormValidatorFn from a zod schema. By default the validator's input type is the
 * schema's input type; pass TFormInput explicitly when the form state is intentionally wider than
 * the schema input (the validator safeParses any value at runtime, so this is always safe).
 *
 * @deprecated Use the `schema` form option or `standardSchemaValidator` instead — zod >= 3.24
 * implements the Standard Schema interface, and both provide the same behavior and typing
 * (including the input-widening TFormInput parameter). zodValidator will be removed in
 * keck-forms 4.
 */
declare const zodValidator: <TSchema extends z.Schema<any>, TFormInput extends ObjectOrUnknown = z.input<TSchema>>(schema: TSchema) => FormValidatorFn<TFormInput, z.output<TSchema>>;

export { FormProvider, KeckField, KeckFieldArray, KeckFieldObject, KeckForm, StandardSchemaV1, standardSchemaValidator, useForm, useFormContext, zodValidator };
export type { FormInputType, FormMetaType, FormOutputType, FormValidatorFn, KeckFormOptions, OnSubmitAttemptFn, OnSubmitFn };
