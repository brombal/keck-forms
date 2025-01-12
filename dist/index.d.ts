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
}

declare class KeckFieldObject<TFormInput extends object, TStringPath extends StringPath<TFormInput>> extends KeckFieldBase<TFormInput, TStringPath> {
    field<TPath extends string>(_path: TPath): `${TStringPath}.${TPath}` extends StringPath<TFormInput> ? KeckFieldForPath<TFormInput, `${TStringPath}.${TPath}` extends StringPath<TFormInput> ? `${TStringPath}.${TPath}` : never> : never;
}

interface KeckFormState<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> {
    initial: TFormInput;
    values: TFormInput;
    output: TFormOutput | null;
    touched: any;
    errors: Record<string, string[]>;
    validator: FormValidatorFn<TFormInput, TFormOutput>;
}
type FormValidatorFn<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> = (input: TFormInput, setError: (field: StringPath<TFormInput>, error: string | null | undefined | false, action?: 'push' | 'unshift' | 'replace') => void) => TFormOutput | null;
/**
 * The public interface for the KeckForm class constructor parameters.
 */
interface KeckFormOptions<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> {
    initial: TFormInput;
    validate: FormValidatorFn<TFormInput, TFormOutput>;
}
declare const state: unique symbol;
/**
 * The base class for a Keck Form, which is created by providing a state object. The state object should be a configured Keck observer.
 *
 * Note that a KeckForm is just a wrapper around an existing state object. Multiple KeckForm objects can exist that wrap
 * different Keck observers of the same underlying state object.
 */
declare class KeckForm<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> {
    private [state];
    /**
     * Creates a KeckForm by providing an initial state and a validation function.
     * @param options The initial state and validation function.
     */
    constructor(options: KeckFormOptions<TFormInput, TFormOutput>);
    get initial(): TFormInput;
    set initial(value: TFormInput);
    get output(): TFormOutput | null;
    validate(): TFormOutput;
    get isValid(): boolean;
    field<TReturn>(_path: unknown extends TFormInput ? string : never): unknown extends TFormInput ? TypedKeckField<TReturn> : never;
    field<TStringPath extends StringPath<TFormInput>>(_path: unknown extends TFormInput ? never : TStringPath): unknown extends TFormInput ? never : KeckFieldForPath<TFormInput, TStringPath>;
    focus(): this;
    /**
     * Adds a callback that will be called when the form state changes. This returns a FormObserver
     * object that can be used to observe specific fields in the form. E.g.:
     *
     * ```ts
     * import { focus } from 'keck';
     *
     * const form = new KeckForm({ ... })
     *
     * // Add an observer callback
     * const formObserver = form.observe(() => { console.log('form changed') });
     *
     * // Optional: "focus" the formObserver (using Keck's `focus` method) to ensure the callback is
     * // only called upon changes to the specific properties accessed on this formObserver.
     * // (If you don't call `focus`, the callback will be called on any change to the form state.)
     * focus(formObserver);
     * formObserver.field('name').value; // Access a property to observe changes to it
     *
     * // Changing a field value will trigger the callback:
     * form.field('name').value = 'Jane'; // logs 'form changed'
     * ```
     */
    observe(callback: () => void): KeckForm<TFormInput, TFormOutput>;
    get state(): KeckFormState<TFormInput, TFormOutput>;
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
    protected readonly formState: KeckFormState<TFormInput, unknown>;
    readonly path: TStringPath;
    constructor(form: KeckForm<TFormInput, unknown>, formState: KeckFormState<TFormInput, unknown>, path: TStringPath);
    get value(): TFormInput extends object ? ValueAtPath<TFormInput, TStringPath> : unknown;
    set value(value: ValueAtPath<TFormInput, TStringPath>);
    get dirty(): boolean;
    get touched(): boolean;
    set touched(value: boolean);
    get errors(): string[];
    get isValid(): boolean;
}
declare class KeckField<TFormInput extends ObjectOrUnknown, TStringPath extends StringPath<TFormInput>> extends KeckFieldBase<TFormInput, TStringPath> {
}

type UseFormReturn<TFormInput extends ObjectOrUnknown, TFormOutput extends ObjectOrUnknown> = {
    form: KeckForm<TFormInput, TFormOutput>;
    FormProvider: React.FC<{
        children: React.ReactNode | React.ReactNode[];
    }>;
};
declare function useForm<TFormInput extends object, TFormOutput extends object>(options: {
    initial: TFormInput;
    validate: FormValidatorFn<TFormInput, TFormOutput>;
}): UseFormReturn<TFormInput, TFormOutput>;

declare function useFormContext<TFormInput extends ObjectOrUnknown = unknown, TFormOutput extends ObjectOrUnknown = unknown>(): KeckForm<TFormInput, TFormOutput>;

declare const zodValidator: <TInput extends object, TOutput extends object>(schema: z.Schema<TOutput>) => FormValidatorFn<TInput, TOutput>;

export { KeckField, KeckFieldArray, KeckFieldObject, KeckForm, type KeckFormOptions, useForm, useFormContext, zodValidator };
