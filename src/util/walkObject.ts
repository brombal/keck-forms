import { isObjectOrArray } from './util';

/**
 * Recursively walks an object and calls `fn` with the value and path of each value in the object.
 */
export function walkObject(obj: any, fn: (value: any, path: (string | number | symbol)[]) => void) {
  _walkObject(obj, fn, []);
}

function _walkObject(
  obj: any,
  fn: (value: any, path: (string | number | symbol)[]) => void,
  path: (string | number | symbol)[],
) {
  if (!isObjectOrArray(obj)) return;
  let key: string | number;
  const isArray = Array.isArray(obj);
  for (key in obj) {
    if (isArray) key = Number(key);
    const value = obj[key];
    fn(value, [...path, key]);
    _walkObject(value, fn, [...path, key]);
  }
}
