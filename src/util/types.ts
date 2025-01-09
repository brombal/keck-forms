/**
 * Type that represents a plain object (custom classes are not permitted; built-ins like Date or RegExp are not permitted; etc)
 */
export type PlainObject = object & { [key: string]: unknown };

export type ObjectPathArray = Array<string | number | symbol>;
export type ObjectPath = string | number | symbol | ObjectPathArray;

export type ObjectPathSimpleArray = Array<string | number>;
export type ObjectPathSimple = string | number | ObjectPathSimpleArray;

export function ensureArrayPath<T extends ObjectPath | ObjectPathSimple>(
  path: T,
): T extends ObjectPathSimple ? ObjectPathSimpleArray : ObjectPathArray {
  return (Array.isArray(path) ? path : typeof path === 'string' ? path.split('.') : [path]) as any;
}

type StringPath<T> = T extends Array<infer _>
  ? `${number}` | `${number}.${StringPath<T[number]>}`
  : T extends object
    ? {
        [K in keyof T & string]: `${K}` | `${K}.${StringPath<T[K]>}`;
      }[keyof T & string]
    : never;

type ValueAtPath<
  TValue,
  TPropString extends string,
> = TPropString extends `${infer Key}.${infer Rest}`
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

function getField<T, P extends StringPath<T>>(obj: T, path: P): ValueAtPath<T, P> {
  const keys = path.split('.');
  let result: any = obj;

  for (const key of keys) {
    if (result === undefined || result === null) {
      return undefined as ValueAtPath<T, P>;
    }

    const indexMatch = key.match(/^\d+$/); // Check if the key is an array index
    if (indexMatch) {
      result = result[Number(key)];
    } else {
      result = result[key];
    }
  }

  return result as ValueAtPath<T, P>;
}

interface Profile {
  name: { first: string; last: string };
  age: number;
  hobbies: { name: string; level: number }[];
  books: Set<string>;
}

const profile: Profile = {
  name: { first: 'Alex', last: 'Smith' },
  age: 30,
  hobbies: [
    { name: 'Piano', level: 5 },
    { name: 'Running', level: 3 },
  ],
  books: new Set('asdf'),
};

const fhobbyName = getField(profile, 'name.first'); // string
const hobbyName = getField(profile, 'hobbies.0.name'); // string
const age = getField(profile, 'age'); // number
const books = getField(profile, 'name.first'); // number

console.log(hobbyName); // Output: "Piano"
console.log(age); // Output: 30
