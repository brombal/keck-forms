import type { ObjectPath, ObjectPathArray } from './ObjectPath.types';
import get from './get';

/**
 * This function recursively removes a specified property from a given object. The property path can be provided as a
 * dot-separated string, an array, or a single property. The function traverses obj, removes the target property, and if
 * this deletion results in an empty parent object, it also removes that parent. It continues this process up the object
 * tree, cleaning up all objects left empty by the removals. The function mutates the object directly and does not
 * provide a return value.
 */
export default function removePropertyPath<T extends object>(obj: T, path: ObjectPath<T>): any {
  const pathArray: ObjectPathArray<T> = (
    (Array.isArray(path) ? path : typeof path === 'string' ? path.split('.') : [path]) as any[]
  ).filter((p) => p !== '' && p !== null && p !== undefined) as ObjectPathArray<T>;

  if (!pathArray.length) return;

  const lastPath = pathArray.pop();
  const parent: any = pathArray.length ? get(obj, pathArray as any) : obj;
  delete parent?.[lastPath];

  if (pathArray.length && parent && !Object.keys(parent).length) {
    removePropertyPath(obj, pathArray);
  }
}
