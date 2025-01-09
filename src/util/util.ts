/**
 * Utility that checks if any of the keys in `object` are "ancestors" of `path`,
 * e.g. if path is 'a.b.c', it will return true if 'a' or 'a.b' are keys in `object`.
 */
export function hasAncestorsOfPath(object: Record<string, any>, path: string) {
  const parts = path.split('.');
  for (let i = 1; i < parts.length; i++) {
    const ancestor = parts.slice(0, i).join('.');
    if (ancestor in object) return true;
  }
  return false;
}

/**
 * Utility that returns all keys in `object` that are "ancestors" of `path`,
 * e.g. if path is 'a.b.c', it will return ['a', 'a.b'] if those keys exist in `object`.
 */
export function getAncestorPaths(object: Record<string, any>, path: string) {
  const parts = path.split('.');
  const paths: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    const ancestor = parts.slice(0, i).join('.');
    if (ancestor in object) paths.push(ancestor);
  }
  return paths;
}

/**
 * Utility that checks if any of the keys in `object` are "descendents" of `path`,
 * e.g. if path is 'a.b', it will return true if 'a.b.c' is a key in `object`.
 */
export function hasDescendentsOfPath(object: Record<string, any>, path: string) {
  for (const key in object) {
    if (key.startsWith(path + '.')) return true;
  }
  return false;
}

/**
 * Utility that returns all keys in `object` that are "descendents" of `path`,
 * e.g. if path is 'a.b', it will return ['a.b.c', 'a.b.d'] if those keys exist in `object`.
 */
export function getDescendentPaths(object: Record<string, any>, path: string) {
  const paths: string[] = [];
  for (const key in object) {
    if (key.startsWith(path + '.')) paths.push(key);
  }
  return paths;
}

export function everyRecursive(obj: any, fn: (value: any) => boolean = Boolean) {
  if (typeof obj !== 'object') return fn(obj);
  if (obj === null) return fn(obj);

  for (const key in obj) {
    if (!everyRecursive(obj[key], fn)) return false;
  }

  return true;
}

export function anyRecursive(obj: any, fn: (value: any) => boolean = Boolean) {
  if (typeof obj !== 'object') return fn(obj);
  if (obj === null) return fn(obj);

  for (const key in obj) {
    if (anyRecursive(obj[key], fn)) return true;
  }

  return false;
}

export function hasAnyProperty(obj: any) {
  for (const _key in obj) {
    return true;
  }
  return false;
}

export function isObjectOrArray(value: any) {
  return (
    value !== null &&
    typeof value === 'object' &&
    (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype)
  );
}
