import { unwrap } from 'keck';
import { cloneDeepWith } from 'lodash-es';

/**
 * Deep-clones a form value (initial values in the constructor and reset, and the input passed to
 * the validator).
 *
 * The value itself may be a Keck observable proxy (e.g. initial values read directly from another
 * observable) — it is unwrapped before cloning, mirroring Keck's own assignment semantics (Keck
 * unwraps any observable value written through an observable).
 *
 * Proxies *nested inside plain containers* are an invariant error. Keck guarantees that raw
 * observable state never contains proxies (all write paths unwrap), so a nested proxy can only
 * mean userland built a plain object/array with values read through an observable and handed it
 * to the form (e.g. `setValues({ ...values, field: otherStore.field })`). Silently accepting it
 * would poison the form's raw state: deep traversal of raw values (cloning, equality checks)
 * breaks on proxies, and reads through a foreign proxy register observations on the foreign
 * observer. Fail loudly and tell the caller what to do instead.
 */
export function cloneValues<T>(value: T): T {
  return cloneDeepWith(unwrap(value), (nested) => {
    if (unwrap(nested) !== nested) {
      throw new Error(
        'keck-forms: a Keck observable proxy was found nested inside a value being stored in ' +
          'form state. Values read through a Keck observable are proxies; unwrap() them before ' +
          'combining them into plain objects or arrays (e.g. ' +
          'setValues({ ...values, field: unwrap(store.field) })).',
      );
    }
    return undefined; // not a proxy — lodash default cloning
  });
}
