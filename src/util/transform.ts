/**
 * Recursively transforms `target` into the shape of `source`, in place.
 *
 * - Both `target` and `source` must be arrays or plain objects at the top level;
 *   otherwise an error is thrown.
 * - If both `target` and `source` have the same structure type (array <-> array,
 *   object <-> object), then we recurse.
 * - Any mismatch in structure means we directly replace the `target` value with
 *   the `source` value.
 * - Any primitive or "complex object" (Date, Set, Map, etc.) in `source`
 *   directly replaces the value in `target`.
 * - Any properties in `target` not in `source` are deleted.
 *
 * @param target The object/array to transform *in-place*.
 * @param source The source object/array to match shape.
 * @returns The same `target` reference, now transformed to match `source`.
 * @throws If top-level `target` or `source` is not an array or plain object.
 */
export function transform<TTarget extends Transformable, TSource>(
  target: TTarget,
  source: TSource,
): TSource {
  if (!isSupportedStructure(target) || !isSupportedStructure(source)) {
    throw new Error('Both target and source must be plain objects or arrays.');
  }

  // If top-level mismatch, return source directly (new reference).
  if (Array.isArray(target) !== Array.isArray(source)) {
    // This effectively discards the old `target` reference.
    // The caller must use the returned value if they want the new shape.
    return source;
  }

  // If both are supported structures, transform object in place
  if (isPlainObject(target) && isPlainObject(source)) {
    // Remove keys in target that do not exist in source
    for (const key in target) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) {
        delete target[key];
      }
    }
  } else if (Array.isArray(target) && Array.isArray(source)) {
    // Adjust length of target array
    target.length = source.length;
  }

  // For each key in source, set/transform target’s value
  let key: string | number;
  for (key in source) {
    const srcVal = (source as PlainObject)[key];
    const tgtVal = (target as PlainObject)[key];

    if (isSupportedStructure(srcVal) && isSupportedStructure(tgtVal)) {
      // Supported structures => recurse
      (target as PlainObject)[key] = transform(tgtVal, srcVal);
    } else {
      // Type mismatch => direct replacement
      (target as PlainObject)[key] = srcVal;
    }
  }
  return target as TSource;
}

/**
 * A "plain object" in TypeScript can be represented by a Record<string, unknown>.
 */
type PlainObject = Record<string, unknown>;

/**
 * We only allow transforming plain objects or arrays of unknown.
 */
type Transformable = Record<string, unknown> | unknown[];

/**
 * Type guard: returns `true` if `val` is a *plain* JavaScript object
 * (i.e. `{}` — not `null`, not an array, and not any special built-in).
 */
function isPlainObject(val: unknown): val is PlainObject {
  return (
    val !== null &&
    typeof val === 'object' &&
    Object.prototype.toString.call(val) === '[object Object]'
  );
}

/**
 * Type guard: returns `true` if `val` is either an array or a plain object.
 * These are the only two "structures" our transform supports.
 */
function isSupportedStructure(val: unknown): val is Transformable {
  return Array.isArray(val) || isPlainObject(val);
}
