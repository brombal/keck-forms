import { focus, observe } from 'keck';
import { KeckForm } from 'keck-forms/KeckForm';
import { vi } from 'vitest';

describe('touched', () => {
  test('Touching a form field should work', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    expect(form.field('name').touched).toBe(false);
    expect(form.field('age').touched).toBe(false);
    expect(form.field('friends').touched).toBe(false);
    expect(form.touched).toBe(false);

    form.field('name').touched = true;

    expect(form.field('name').touched).toBe(true);
    expect(form.field('age').touched).toBe(false);
    expect(form.field('friends').touched).toBe(false);
    expect(form.touched).toBe(true);

    form.field('friends.0.name').touched = true;

    expect(form.field('friends.0.name').touched).toBe(true);
    expect(form.field('friends.0.age').touched).toBe(false);
    expect(form.field('friends.0').touched).toBe(true);
    expect(form.field('friends.1').touched).toBe(false);
    expect(form.field('friends').touched).toBe(true);
    expect(form.touched).toBe(true);
  });

  test('Touching a nested form field should work', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    form.field('friends.0.name').touched = true;

    expect(form.field('friends.0.name').touched).toBe(true);
    expect(form.field('friends.0.age').touched).toBe(false);
    expect(form.field('friends.0').touched).toBe(true);
    expect(form.field('friends.1').touched).toBe(false);
    expect(form.field('friends').touched).toBe(true);
    expect(form.touched).toBe(true);
  });

  test('Touching a form field collection should work', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    form.field('friends').touched = true;

    expect(form.field('friends.0.name').touched).toBe(true);
    expect(form.field('friends.0.age').touched).toBe(true);
    expect(form.field('friends.0').touched).toBe(true);
    expect(form.field('friends.1').touched).toBe(true);
    expect(form.field('friends').touched).toBe(true);
    expect(form.field('name').touched).toBe(false);
    expect(form.field('age').touched).toBe(false);
    expect(form.touched).toBe(true);
  });

  test('Un-touching a nested form field should work', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 20 },
      ],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    form.field('friends.0.name').touched = true;
    form.field('friends.1.name').touched = true;

    form.field('friends.0.name').touched = false;

    expect(form.field('friends.0.name').touched).toBe(false);
    expect(form.field('friends.0.age').touched).toBe(false);
    expect(form.field('friends.0').touched).toBe(false);
    expect(form.field('friends.1.name').touched).toBe(true);
    expect(form.field('friends.1.age').touched).toBe(false);
    expect(form.field('friends.1').touched).toBe(true);
    expect(form.field('friends').touched).toBe(true);
    expect(form.touched).toBe(true);

    form.field('friends.1.name').touched = false;

    expect(form.field('friends.0.name').touched).toBe(false);
    expect(form.field('friends.0.age').touched).toBe(false);
    expect(form.field('friends.0').touched).toBe(false);
    expect(form.field('friends.1.name').touched).toBe(false);
    expect(form.field('friends.1.age').touched).toBe(false);
    expect(form.field('friends.1').touched).toBe(false);
    expect(form.field('friends.1').touched).toBe(false);
    expect(form.field('friends').touched).toBe(false);
    expect(form.touched).toBe(false);
  });

  test('Touching entire form should work', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    form.touched = true;

    expect(form.field('friends.0.name').touched).toBe(true);
    expect(form.field('friends.0.age').touched).toBe(true);
    expect(form.field('friends.0').touched).toBe(true);
    expect(form.field('friends.1').touched).toBe(true);
    expect(form.field('friends').touched).toBe(true);
    expect(form.field('name').touched).toBe(true);
    expect(form.field('age').touched).toBe(true);
    expect(form.touched).toBe(true);
  });

  test('Un-touching entire form should work', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 20 },
      ],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    form.field('friends.0.name').touched = true;
    form.field('friends.1.name').touched = true;

    form.touched = false;

    expect(form.field('friends.0.name').touched).toBe(false);
    expect(form.field('friends.0.age').touched).toBe(false);
    expect(form.field('friends.0').touched).toBe(false);
    expect(form.field('friends.1.name').touched).toBe(false);
    expect(form.field('friends.1.age').touched).toBe(false);
    expect(form.field('friends.1').touched).toBe(false);
    expect(form.field('friends.1').touched).toBe(false);
    expect(form.field('friends').touched).toBe(false);
    expect(form.touched).toBe(false);
  });

  test('Un-touching one field does not clear bulk-touched parent', () => {
    const form = new KeckForm({
      initial: {
        name: 'John',
        age: 20,
        friends: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
        ],
      },
      validate: () => ({}),
    });

    // Bulk-touch the friends array
    form.field('friends').touched = true;

    // Untouching a specific nested field should NOT clear the friends bulk touch
    form.field('friends.0.name').touched = false;

    // friends.0.age should still be touched (covered by friends: true sentinel)
    expect(form.field('friends.0.age').touched).toBe(true);
    // friends.1.name should still be touched
    expect(form.field('friends.1.name').touched).toBe(true);
    // friends itself should still be touched
    expect(form.field('friends').touched).toBe(true);
    // form should still be touched
    expect(form.touched).toBe(true);
  });

  test('Un-touching one field does not clear form-level bulk touch', () => {
    const form = new KeckForm({
      initial: { name: 'John', age: 20 },
      validate: () => ({}),
    });

    // Bulk-touch the entire form
    form.touched = true;

    // Untouching a specific field should not clear the form-level bulk touch
    form.field('name').touched = false;

    // age should still be touched via form-level bulk touch
    expect(form.field('age').touched).toBe(true);
    expect(form.touched).toBe(true);
  });

  test('Observer callback is only triggered when touched state changes', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = observe(
      new KeckForm({
        initial,
        validate: () => ({}),
      }),
    );

    const mockFn = vi.fn();
    const formObserver = observe(form, mockFn);
    focus(formObserver);

    // Observe touched value
    void formObserver.field('friends.0.name').touched;
    void formObserver.field('age').touched;

    // Changing value should trigger callback
    form.field('friends.0.name').touched = true;
    expect(mockFn).toHaveBeenCalledTimes(1);

    mockFn.mockReset();

    // Changing value again should not trigger callback
    form.field('friends').touched = true;
    expect(mockFn).toHaveBeenCalledTimes(0);

    // Changing value of other field should trigger callback
    form.field('age').touched = true;
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
