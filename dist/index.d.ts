import React from 'react';
import { IsNever, IsUnknown, Paths, LiteralUnion, Get } from 'type-fest';
import { z } from 'zod';

declare const $values: unique symbol;
declare const $errors: unique symbol;
declare const $touched: unique symbol;

type FormValidatorFn<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> = (input: TFormInput, setError: (field: StringPaths<TFormInput>, error: string | null | undefined | false, action?: 'push' | 'unshift' | 'replace') => void) => TFormOutput | null;
type OnSubmitFn<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> = (output: TFormOutput, form: KeckForm<TFormInput, TFormOutput>) => Promise<void> | void;
type OnSubmitAttemptFn = () => Promise<void> | void;
/**
 * The public interface for the KeckForm class constructor parameters.
 */
type KeckFormOptions<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> = {
    initial: TFormInput;
    validate?: FormValidatorFn<TFormInput, TFormOutput>;
    onSubmit?: OnSubmitFn<TFormInput, TFormOutput>;
    onSubmitAttempt?: OnSubmitAttemptFn;
};
declare const reassignOptions: unique symbol;
/**
 * A KeckForm object represents the entire state of a form.
 */
declare class KeckForm<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown = TFormInput> {
    initial: TFormInput;
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
    constructor(options: KeckFormOptions<TFormInput, TFormOutput>);
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

type UseFormReturn<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> = {
    form: KeckForm<TFormInput, TFormOutput>;
    FormProvider: React.FC<{
        children: React.ReactNode | React.ReactNode[];
    }>;
};
declare function useForm<TFormInput extends object, TFormOutput extends object = TFormInput>(options: {
    tryContext?: boolean;
    initial: TFormInput | (() => TFormInput);
    validate?: FormValidatorFn<NoInfer<TFormInput>, TFormOutput>;
    onSubmit?: OnSubmitFn<TFormInput, TFormOutput>;
    onSubmitAttempt?: OnSubmitAttemptFn;
}, deps?: any[]): UseFormReturn<TFormInput, TFormOutput>;

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

declare class KeckFieldArray<TFormInput extends object, TStringPath extends string> extends KeckFieldBase<TFormInput, TStringPath> {
    field<TPath extends string>(_path: TPath): `${TStringPath}.${TPath}` extends StringPaths<TFormInput> ? KeckFieldForPath<TFormInput, `${TStringPath}.${TPath}` extends StringPaths<TFormInput> ? `${TStringPath}.${TPath}` : never> : never;
    /**
     * Maps each field in the array to a new value by invoking the callback function.
     */
    map<TReturn>(_callback: (field: KeckFieldForPath<TFormInput, `${TStringPath}.${number}` extends StringPaths<TFormInput> ? `${TStringPath}.${number}` : never>, index: number) => TReturn): TReturn[];
    get allErrors(): Array<{
        path: string;
        errors: string[];
    }>;
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

declare function useFormContext<TFormInput extends ObjectOrUnknown = unknown, TFormOutput extends ObjectOrUnknown = unknown>(dontThrowOnMissingProvider: true): KeckForm<TFormInput, TFormOutput> | null;
declare function useFormContext<TFormInput extends ObjectOrUnknown = unknown, TFormOutput extends ObjectOrUnknown = unknown>(dontThrowOnMissingProvider?: false): KeckForm<TFormInput, TFormOutput>;

declare const zodValidator: <TSchema extends z.Schema<any>>(schema: TSchema) => TSchema extends z.Schema ? FormValidatorFn<any, z.output<TSchema>> : never;

export { type FormInputType, type FormOutputType, KeckField, KeckFieldArray, KeckFieldObject, KeckForm, type KeckFormOptions, useForm, useFormContext, zodValidator };
