import { KeckForm } from 'keck-forms/KeckForm';
import { zodValidator } from 'keck-forms/zodValidator';
import { z } from 'zod';

describe('zod validation', () => {
  test('Basic validation works', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const schema = z.object({
      name: z.string(),
      age: z.number().min(18, 'You must be 18 or older'),
      friends: z
        .array(
          z.object({
            name: z.string(),
            age: z.number().min(18, 'Friend must be 18 or older'),
          }),
        )
        .min(1, 'You must have at least one friend'),
    });

    const form = new KeckForm({
      initial,
      validate: zodValidator(schema),
    });

    expect(form.isValid).toBe(true);

    form.field('age').value = 17;
    expect(form.isValid).toBe(false);
    expect(form.field('age').errors).toEqual(['You must be 18 or older']);

    form.field('friends').value = [];
    expect(form.isValid).toBe(false);
    expect(form.field('friends').errors).toEqual(['You must have at least one friend']);
  });
});
