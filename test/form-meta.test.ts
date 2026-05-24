import { focus, observe } from 'keck';
import { KeckForm, reassignOptions } from 'keck-forms/KeckForm';
import type { FormMetaType } from 'keck-forms/types';
import type { UseFormReturn } from 'keck-forms/useForm';
import { vi } from 'vitest';

describe('form meta', () => {
  test('meta property is accessible and mutable', () => {
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: () => ({}),
      meta: { serverError: null as string | null, count: 0 },
    });

    expect(form.meta.serverError).toBe(null);
    expect(form.meta.count).toBe(0);

    form.meta.serverError = 'Something went wrong';
    expect(form.meta.serverError).toBe('Something went wrong');

    form.meta.count = 5;
    expect(form.meta.count).toBe(5);
  });

  test('meta changes trigger observers', () => {
    const form = observe(
      new KeckForm({
        initial: { name: 'John' },
        validate: () => ({}),
        meta: { serverError: null as string | null },
      }),
    );

    const mockFn = vi.fn();
    const formObserver = observe(form, { focusable: true, onChange: mockFn });
    const { commit } = focus(formObserver);

    void formObserver.meta.serverError;
    commit();

    form.meta.serverError = 'An error';
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('meta observer does not fire when unobserved meta property changes', () => {
    const form = observe(
      new KeckForm({
        initial: { name: 'John' },
        validate: () => ({}),
        meta: { serverError: null as string | null, count: 0 },
      }),
    );

    const mockFn = vi.fn();
    const formObserver = observe(form, { focusable: true, onChange: mockFn });
    const { commit } = focus(formObserver);

    void formObserver.meta.serverError; // only observe serverError
    commit();

    form.meta.count = 99; // unobserved — should not fire
    expect(mockFn).toHaveBeenCalledTimes(0);

    form.meta.serverError = 'error'; // observed — should fire
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('meta type is strongly inferred', () => {
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: () => ({}),
      meta: { count: 0, message: '' },
    });

    // These should compile with correct types
    form.meta.count.toFixed();
    form.meta.message.toLowerCase();

    // @ts-expect-error - count is not a string
    void form.meta.count.toLowerCase;
    // @ts-expect-error - message is not a number
    void form.meta.message.toFixed;
  });

  test('meta defaults to an empty object when not provided', () => {
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: () => ({}),
    });

    expect(form.meta).toBeDefined();
    expect(typeof form.meta).toBe('object');
  });

  test('meta persists across reassignOptions calls', () => {
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: () => ({}),
      meta: { serverError: '' },
    });

    form.meta.serverError = 'some error';
    form[reassignOptions]({ validate: () => ({}) });

    // meta value should persist after options are reassigned
    expect(form.meta.serverError).toBe('some error');
  });

  test('FormMetaType utility extracts TMeta from UseFormReturn', () => {
    type MyReturn = UseFormReturn<{ name: string }, { name: string }, { count: number }>;
    type Meta = FormMetaType<MyReturn>;

    // This is a compile-time test; just check the type is right via assignment
    const _check: Meta = { count: 0 };
    void _check;
  });
});
