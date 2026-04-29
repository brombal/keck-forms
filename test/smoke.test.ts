import { KeckForm } from 'keck-forms/KeckForm';

describe('smoke', () => {
  test('keck forms should have basic functionality', () => {
    const form = new KeckForm({
      initial: { name: 'John' },
    });

    const _form2 = new KeckForm({
      initial: { name: 'John' },
      onSubmit: (output) => {
        output.name;
        // @ts-expect-error expected to fail on unknown fields
        output.asdf;
      },
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
      });

      // known fields
      form.field('name').value.toUpperCase();
      form.field('age').value.toFixed(2);

      // @ts-expect-error - unknown field
      form.field('unknown');

      form.field<string>('unknown').value.toUpperCase();

      const unknownForm: KeckForm<unknown, unknown> = new KeckForm({
        initial: {} as unknown,
      });
      void unknownForm.field<string>('name').value.toUpperCase;
      void unknownForm.field<number>('age').value.toFixed;

      // This is okay but it returns a KeckField with unknown value
      const unknownField = unknownForm.field('age');
      // @ts-expect-error - unknown field
      unknownField.value.anything;

      // @ts-expect-error - unknown type
      unknownForm.field('age').value.toFixed?.(2);
    });
  });
});
