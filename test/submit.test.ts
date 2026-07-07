import { unwrap } from 'keck';
import { KeckForm, reassignOptions } from 'keck-forms/KeckForm';
import { standardSchemaValidator } from 'keck-forms/standardSchemaValidator';
import { vi } from 'vitest';
import { z } from 'zod';

describe('submit', () => {
  test('onSubmit should be called if form is valid', () => {
    const initial = { name: 'John', age: 20 };
    const onSubmit = vi.fn();

    const form = new KeckForm({
      initial,
      validate: standardSchemaValidator(
        z.object({
          name: z.string(),
          age: z.number().min(18),
        }),
      ),
      onSubmit: onSubmit as () => void,
    });

    form.handleSubmit();

    expect(onSubmit.mock.calls[0][0]).toEqual(initial);
    expect(unwrap(onSubmit.mock.calls[0][1])).toBe(unwrap(form));
    expect(form.submitCount).toBe(1);
    expect(form.submitAttemptCount).toBe(1);
  });

  test('onSubmitAttempt should be called if form is invalid', () => {
    const initial = { name: 'John', age: 20 };
    const onSubmit = vi.fn() as () => void;
    const onSubmitAttempt = vi.fn() as () => void;

    const form = new KeckForm({
      initial,
      validate: standardSchemaValidator(
        z.object({
          name: z.string(),
          age: z.number().min(18),
        }),
      ),
      onSubmit,
      onSubmitAttempt,
    });

    form.field('age').value = 17; // Set an invalid value

    form.handleSubmit();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onSubmitAttempt).toHaveBeenCalled();
    expect(form.submitCount).toBe(0);
    expect(form.submitAttemptCount).toBe(1);
  });

  test('isSubmitting is true while onSubmit is executing', async () => {
    let resolve!: () => void;
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: standardSchemaValidator(z.object({ name: z.string() })),
      onSubmit: () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    });

    const pending = form.handleSubmit();
    expect(form.isSubmitting).toBe(true);

    resolve();
    await pending;
    expect(form.isSubmitting).toBe(false);
  });

  test('submitError is set when onSubmit throws', async () => {
    const error = new Error('submission failed');
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: standardSchemaValidator(z.object({ name: z.string() })),
      onSubmit: async () => {
        throw error;
      },
    });

    await form.handleSubmit();

    expect(form.submitError).toBe(error);
    expect(form.submitCount).toBe(1); // incremented before onSubmit throws
  });

  test('a throwing submit handler is surfaced via console.error, not just stored', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('boom');
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: standardSchemaValidator(z.object({ name: z.string() })),
      onSubmit: () => {
        throw error;
      },
    });

    await form.handleSubmit();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('KeckForm'), error);
    consoleSpy.mockRestore();
  });

  test('onSubmit receives a singly-wrapped form whose value unwraps to the raw object', async () => {
    // Regression: KeckForm.value is a class getter returning an observable child; with
    // keck < 2.3.4 the getter result was double-wrapped, so unwrap() left a live proxy and
    // structuredClone(unwrap(f.value)) threw.
    let checked = false;
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: standardSchemaValidator(z.object({ name: z.string() })),
      onSubmit: (_output, f) => {
        const raw = unwrap(f.value);
        expect(unwrap(raw)).toBe(raw); // a single unwrap reaches the raw object
        expect(() => structuredClone(raw)).not.toThrow();
        expect(structuredClone(raw)).toEqual({ name: 'John' });
        checked = true;
      },
    });

    await form.handleSubmit();
    expect(form.submitError).toBeNull();
    expect(checked).toBe(true);
  });

  test('handleSubmit calls e.preventDefault when given an event-like object', async () => {
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: standardSchemaValidator(z.object({ name: z.string() })),
    });
    const e = { preventDefault: vi.fn() };

    await form.handleSubmit(e);

    expect(e.preventDefault).toHaveBeenCalled();
  });

  test('reassignOptions updates onSubmit and onSubmitAttempt', async () => {
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: standardSchemaValidator(z.object({ name: z.string().min(1) })),
    });

    const onSubmit = vi.fn() as () => void;
    const onSubmitAttempt = vi.fn() as () => void;
    form[reassignOptions]({ onSubmit, onSubmitAttempt });

    await form.handleSubmit();
    expect(onSubmit).toHaveBeenCalled();

    form.field('name').value = '';
    await form.handleSubmit();
    expect(onSubmitAttempt).toHaveBeenCalled();
  });
});
