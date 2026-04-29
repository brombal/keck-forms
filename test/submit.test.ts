import { unwrap } from 'keck';
import { KeckForm } from 'keck-forms/KeckForm';
import { zodValidator } from 'keck-forms/zodValidator';
import { vi } from 'vitest';
import { z } from 'zod';

describe('submit', () => {
  test('onSubmit should be called if form is valid', () => {
    const initial = { name: 'John', age: 20 };
    const onSubmit = vi.fn();

    const form = new KeckForm({
      initial,
      validate: zodValidator(
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
      validate: zodValidator(
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
});
