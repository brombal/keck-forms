import React from 'react';
import { z } from 'zod';

type StringPath<T> = unknown extends T ? string : T extends Array<infer _> ? `${number}` | `${number}.${StringPath<T[number]>}` : T extends object ? {
    [K in keyof T & string]: `${K}` | `${K}.${StringPath<T[K]>}`;
}[keyof T & string] | '' : never;
type ValueAtPath<TValue, TPropString extends string> = TPropString extends '' ? TValue : TPropString extends `${infer Key}.${infer Rest}` ? TValue extends Array<infer TArrayValue> ? ValueAtPath<TArrayValue, Rest> : Key extends keyof TValue ? ValueAtPath<TValue[Key], Rest> : never : TValue extends Array<infer TArrayValue> ? TArrayValue : TPropString extends keyof TValue ? TValue[TPropString] : never;
type ObjectOrUnknown = object | unknown;

declare class KeckFieldArray<TFormInput extends object, TStringPath extends StringPath<TFormInput>> extends KeckFieldBase<TFormInput, TStringPath> {
    /**
     * Maps each field in the array to a new value by invoking the callback function.
     */
    map<TReturn>(_callback: (field: KeckFieldForPath<TFormInput, `${TStringPath}.${number}` extends StringPath<TFormInput> ? `${TStringPath}.${number}` : never>, index: number) => TReturn): TReturn[];
    get allErrors(): Array<{
        path: string;
        errors: string[];
    }>;
}

declare class KeckFieldObject<TFormInput extends object, TStringPath extends StringPath<TFormInput>> extends KeckFieldBase<TFormInput, TStringPath> {
    field<TPath extends string>(_path: TPath): `${TStringPath}.${TPath}` extends StringPath<TFormInput> ? KeckFieldForPath<TFormInput, `${TStringPath}.${TPath}` extends StringPath<TFormInput> ? `${TStringPath}.${TPath}` : never> : never;
    get allErrors(): Array<{
        path: string;
        errors: string[];
    }>;
}

declare const $values: unique symbol;
declare const $errors: unique symbol;
declare const $touched: unique symbol;

type FormValidatorFn<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> = (input: TFormInput, setError: (field: StringPath<TFormInput>, error: string | null | undefined | false, action?: 'push' | 'unshift' | 'replace') => void) => TFormOutput | null;
type OnSubmitFn<TFormOutput extends ObjectOrUnknown> = (output: TFormOutput) => Promise<void> | void;
type OnSubmitAttemptFn = () => Promise<void> | void;
/**
 * The public interface for the KeckForm class constructor parameters.
 */
type KeckFormOptions<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> = {
    initial: TFormInput;
    validate: FormValidatorFn<TFormInput, TFormOutput>;
    onSubmit?: OnSubmitFn<TFormOutput>;
    onSubmitAttempt?: OnSubmitAttemptFn;
} | {
    initial: TFormInput;
    validate?: never;
    onSubmit?: OnSubmitFn<TFormOutput>;
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
    validate(): TFormOutput | null;
    get isValid(): boolean;
    get dirty(): boolean;
    get touched(): boolean;
    set touched(touched: boolean);
    get errors(): string[];
    get allErrors(): {
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
    field<TReturn>(_path: unknown extends TFormInput ? string : never): unknown extends TFormInput ? TypedKeckField<TReturn> : never;
    field<TStringPath extends StringPath<TFormInput>>(_path: unknown extends TFormInput ? never : TStringPath): unknown extends TFormInput ? never : KeckFieldForPath<TFormInput, TStringPath>;
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

type KeckFieldForPath<TFormInput extends ObjectOrUnknown, TStringPath extends StringPath<TFormInput>> = TFormInput extends object ? ValueAtPath<TFormInput, TStringPath> extends Array<infer _TFieldType> ? KeckFieldArray<TFormInput, TStringPath> : ValueAtPath<TFormInput, TStringPath> extends object ? KeckFieldObject<TFormInput, TStringPath> : KeckField<TFormInput, TStringPath> : KeckField<TFormInput, TStringPath>;
/**
 * Used to represent a KeckField with an explicit type (instead of inferring a type from a form input structure
 * and a string path).
 */
type TypedKeckField<TType> = Omit<KeckFieldBase<unknown, ''>, 'value'> & {
    value: TType;
};
declare abstract class KeckFieldBase<TFormInput extends ObjectOrUnknown, TStringPath extends StringPath<TFormInput>> {
    readonly form: KeckForm<TFormInput, unknown>;
    readonly path: TStringPath;
    constructor(form: KeckForm<TFormInput, unknown>, path: TStringPath);
    get value(): TFormInput extends object ? ValueAtPath<TFormInput, TStringPath> : unknown;
    set value(value: ValueAtPath<TFormInput, TStringPath>);
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
declare class KeckField<TFormInput extends ObjectOrUnknown, TStringPath extends StringPath<TFormInput>> extends KeckFieldBase<TFormInput, TStringPath> {
}

type UseFormReturn<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> = {
    form: KeckForm<TFormInput, TFormOutput>;
    FormProvider: React.FC<{
        children: React.ReactNode | React.ReactNode[];
    }>;
};
declare function useForm<TFormInput extends object, TFormOutput extends object = TFormInput>(options: {
    tryContext?: boolean;
    initial: TFormInput;
    validate?: FormValidatorFn<NoInfer<TFormInput>, TFormOutput>;
    onSubmit?: OnSubmitFn<TFormOutput>;
    onSubmitAttempt?: OnSubmitAttemptFn;
}, deps?: any[]): UseFormReturn<TFormInput, TFormOutput>;

declare function useFormContext<TFormInput extends ObjectOrUnknown = unknown, TFormOutput extends ObjectOrUnknown = unknown>(dontThrowOnMissingProvider: true): KeckForm<TFormInput, TFormOutput> | null;
declare function useFormContext<TFormInput extends ObjectOrUnknown = unknown, TFormOutput extends ObjectOrUnknown = unknown>(dontThrowOnMissingProvider?: false): KeckForm<TFormInput, TFormOutput>;

declare const zodValidator: <TSchema extends z.Schema<any>>(schema: TSchema) => TSchema extends z.Schema ? FormValidatorFn<any, z.output<TSchema>> : never;

export { KeckField, KeckFieldArray, KeckFieldObject, KeckForm, type KeckFormOptions, useForm, useFormContext, zodValidator };
