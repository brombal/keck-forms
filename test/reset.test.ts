import { KeckForm } from 'keck-forms/KeckForm';

describe('reset', () => {
  test('Entire form is reset', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    form.field('name').value = 'Changed';

    form.field('name').touched = true;
    form.field('friends.0.name').touched = true;

    expect(form.touched).toBe(true);
    expect(form.field('name').touched).toBe(true);
    expect(form.field('friends').touched).toBe(true);
    expect(form.field('friends.0').touched).toBe(true);
    expect(form.field('friends.0.name').touched).toBe(true);

    form.handleSubmit();
    expect(form.submitCount).toBe(1);

    form.reset();

    expect(form.field('name').value).toBe(initial.name);

    expect(form.touched).toBe(false);
    expect(form.field('name').touched).toBe(false);
    expect(form.field('friends').touched).toBe(false);
    expect(form.field('friends.0').touched).toBe(false);
    expect(form.field('friends.0.name').touched).toBe(false);

    expect(form.submitCount).toBe(0);
  });

  test('Form is partially reset', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    form.field('name').value = 'Changed';

    form.field('name').touched = true;
    form.field('friends.0.name').touched = true;

    expect(form.touched).toBe(true);
    expect(form.field('name').touched).toBe(true);
    expect(form.field('friends').touched).toBe(true);
    expect(form.field('friends.0').touched).toBe(true);
    expect(form.field('friends.0.name').touched).toBe(true);

    form.handleSubmit();
    expect(form.submitCount).toBe(1);

    form.reset({ values: true });

    expect(form.field('name').value).toBe(initial.name);
    expect(form.touched).toBe(true);
    expect(form.submitCount).toBe(1);

    form.reset({ touched: true });

    expect(form.field('name').value).toBe(initial.name);
    expect(form.touched).toBe(false);
    expect(form.submitCount).toBe(1);

    form.reset({ submit: true });

    expect(form.field('name').value).toBe(initial.name);
    expect(form.touched).toBe(false);
    expect(form.submitCount).toBe(0);
  });
});
