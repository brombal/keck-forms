import { KeckForm } from 'keck-forms/KeckForm';

describe('smoke', () => {
  test('keck forms should have basic functionality', () => {
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: () => ({}),
    });

    // @ts-expect-error - unknown field
    form.field('unknown');

    const nameField = form.field('name');
    expect(nameField.value).toBe('John');

    nameField.value = 'Jane';
    expect(nameField.value).toBe('Jane');
  });
});
