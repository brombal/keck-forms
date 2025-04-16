import { jest } from '@jest/globals';
import { KeckForm } from 'keck-forms/KeckForm';
import { zodValidator } from 'keck-forms/zodValidator';
import { z } from 'zod';

describe('submit', () => {
  test('onSubmit should be called if form is valid', () => {
    const initial = { name: 'John', age: 20 };
    const onSubmit = jest.fn() as () => void;

    const form = new KeckForm({
      initial,
      validate: zodValidator(
        z.object({
          name: z.string(),
          age: z.number().min(18),
        }),
      ),
      onSubmit,
    });

    form.handleSubmit();

    expect(onSubmit).toHaveBeenCalledWith(initial);
    expect(form.submitCount).toBe(1);
    expect(form.submitAttemptCount).toBe(1);
  });

  test('onSubmitAttempt should be called if form is invalid', () => {
    const initial = { name: 'John', age: 20 };
    const onSubmit = jest.fn() as () => void;
    const onSubmitAttempt = jest.fn() as () => void;

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
