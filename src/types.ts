export type StringPath<T> = unknown extends T
  ? string
  : T extends Array<infer _>
    ? `${number}` | `${number}.${StringPath<T[number]>}`
    : T extends object
      ?
          | {
              [K in keyof T & string]: `${K}` | `${K}.${StringPath<T[K]>}`;
            }[keyof T & string]
          | ''
      : never;

export type ValueAtPath<TValue, TPropString extends string> = TPropString extends ''
  ? TValue
  : TPropString extends `${infer Key}.${infer Rest}`
    ? TValue extends Array<infer TArrayValue>
      ? ValueAtPath<TArrayValue, Rest>
      : Key extends keyof TValue
        ? ValueAtPath<TValue[Key], Rest>
        : never
    : TValue extends Array<infer TArrayValue>
      ? TArrayValue
      : TPropString extends keyof TValue
        ? TValue[TPropString]
        : never;

export type ObjectOrUnknown = object | unknown;
