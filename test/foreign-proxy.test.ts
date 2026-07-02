import { configure, observe, resetConfiguration, unwrap } from 'keck';
import { KeckForm } from 'keck-forms/KeckForm';
import { vi } from 'vitest';

/**
 * Values assigned into a form can come from another Keck observable graph — values read through
 * an observable are proxies.
 *
 * Keck guarantees that raw observable state never contains proxies (every write path unwraps the
 * assigned value — see keck's assign-unwrap tests), so a proxy assigned directly to a field is
 * unwrapped by Keck itself and form state stays clean.
 *
 * A proxy *nested inside a plain container* built in userland (e.g.
 * `setValues({ ...values, field: otherStore.field })`) cannot be unwrapped by Keck's traps and
 * would poison raw form state — keck-forms treats this as an invariant error with a descriptive
 * message, raised when the form clones its values (validation, construction, reset).
 */
describe('foreign proxy values', () => {
  afterEach(() => resetConfiguration());

  test('a proxy assigned directly to a field is unwrapped by Keck and validation works', () => {
    const external = observe({ tags: [1, 2, 3], flags: new Set(['a']) }, () => {});

    const form = new KeckForm<{ tags: number[]; flags: Set<string> }>({
      initial: { tags: [], flags: new Set() },
    });

    form.field('tags').value = external.tags;
    form.field('flags').value = external.flags;

    // Raw form state holds the raw values (reference semantics, same as any Keck assignment).
    expect(unwrap(form.field('tags').value)).toBe(unwrap(external.tags));
    expect(unwrap(form.field('flags').value)).toBe(unwrap(external.flags));

    // validate() clones the values — this crashed on proxied values
    // ("array.constructor is not a constructor").
    expect(() => form.validate()).not.toThrow();
    expect(unwrap(form.output)).toEqual({ tags: [1, 2, 3], flags: new Set(['a']) });
  });

  test('a proxy nested inside a plain container is an invariant error', () => {
    const external = observe({ tags: [1, 2, 3] }, () => {});

    const form = new KeckForm<{ name: string; tags: number[] }>({
      initial: { name: '', tags: [] },
    });

    // The write itself triggers the form's re-validation observer; the invariant error thrown
    // inside that callback is routed through Keck's error reporting (loud, not swallowed).
    const onError = vi.fn();
    configure({ onError });
    form.setValues({ name: 'x', tags: external.tags });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(String(onError.mock.calls[0][0])).toMatch(/observable proxy/);

    // Direct validation (e.g. via handleSubmit) throws synchronously with the descriptive error.
    expect(() => form.validate()).toThrow(/unwrap\(\)/);
  });

  test('initial values: a root-level proxy is unwrapped; a nested proxy is an invariant error', () => {
    const external = observe({ form: { tags: [1, 2] } }, () => {});

    // Root-level observable initial: unwrapped and cloned, mirroring Keck assignment semantics.
    const form = new KeckForm<{ tags: number[] }>({ initial: external.form });
    expect(unwrap(form.field('tags').value)).toEqual([1, 2]);
    expect(() => form.validate()).not.toThrow();

    // Initial values are cloned at construction: later external mutations don't leak in.
    external.form.tags.push(3);
    expect(unwrap(form.field('tags').value)).toEqual([1, 2]);

    // Nested proxy inside a plain initial object: fails construction with the descriptive error.
    expect(() => new KeckForm({ initial: { tags: external.form.tags } })).toThrow(
      /observable proxy/,
    );
  });
});
