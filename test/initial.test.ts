import { KeckForm } from 'keck-forms/KeckForm';

describe('initial values', () => {
  test('Initial values should be reflected in field values', () => {
    const initial = { name: 'John', age: 20 };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    expect(form.field('name').value).toBe('John');
    expect(form.field('age').value).toBe(20);
    expect(form.field('').value).toEqual(initial);
    expect(form.field('').value).not.toBe(initial);
  });

  test('Initial values should be readable', () => {
    const initial = { name: 'John', age: 20 };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    expect(form.initial).toEqual(initial);
    expect(form.initial).not.toBe(initial);

    // Check ts types
    form.initial.name.toLowerCase();
    // @ts-expect-error
    void form.initial.name.toFixed;
  });

  test('Initial values should be settable', () => {
    const initial = { name: 'John', age: 20 };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    form.initial.name = 'Jane';
    form.initial.age = 30;

    expect(form.initial).toEqual({ name: 'Jane', age: 30 });

    const newInitial = { name: 'Jack', age: 50 };
    form.initial = newInitial;

    expect(form.initial).toEqual(newInitial);
    expect(form.initial).not.toBe(newInitial);
  });
});
