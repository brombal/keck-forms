import { KeckForm } from 'keck-forms/KeckForm';

describe('smoke', () => {
  test('keck forms should have basic functionality', () => {
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: () => ({}),
    });

    const nameField = form.field('name');
    expect(nameField.value).toBe('John');

    nameField.value = 'Jane';
    expect(nameField.value).toBe('Jane');
  });

  test('keck form .field should have correct typings', () => {
    // wrapper function because this is only for type checking; code does not run
    void (() => {
      const form = new KeckForm({
        initial: { name: 'John', age: 20 },
        validate: () => ({}),
      });

      form.field('name').value.toUpperCase();
      form.field('age').value.toFixed(2);

      // @ts-expect-error - unknown field
      form.field('unknown');

      const unknownForm: KeckForm<unknown, unknown> = new KeckForm({
        initial: {} as unknown,
        validate: () => ({}),
      });
      void unknownForm.field<string>('name').value.toUpperCase;
      void unknownForm.field<number>('age').value.toFixed;

      void unknownForm.field('age').value;

      // @ts-expect-error - unknown type
      unknownForm.field('age').value.toFixed?.(2);
    });
  });
});
