import { jest } from '@jest/globals';
import { KeckForm } from 'keck-forms/KeckForm';

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
    expect(form.field('').touched).toBe(false);

    form.field('name').touched = true;

    expect(form.field('name').touched).toBe(true);
    expect(form.field('age').touched).toBe(false);
    expect(form.field('friends').touched).toBe(false);
    expect(form.field('').touched).toBe(true);

    form.field('friends.0.name').touched = true;

    expect(form.field('friends.0.name').touched).toBe(true);
    expect(form.field('friends.0.age').touched).toBe(false);
    expect(form.field('friends.0').touched).toBe(true);
    expect(form.field('friends.1').touched).toBe(false);
    expect(form.field('friends').touched).toBe(true);
    expect(form.field('').touched).toBe(true);
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
    expect(form.field('').touched).toBe(true);
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
    expect(form.field('').touched).toBe(true);
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

    form.field('').touched = true;

    expect(form.field('friends.0.name').touched).toBe(true);
    expect(form.field('friends.0.age').touched).toBe(true);
    expect(form.field('friends.0').touched).toBe(true);
    expect(form.field('friends.1').touched).toBe(true);
    expect(form.field('friends').touched).toBe(true);
    expect(form.field('name').touched).toBe(true);
    expect(form.field('age').touched).toBe(true);
    expect(form.field('').touched).toBe(true);
  });

  test('Observer callback is only triggered when touched state changes', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    const mockFn = jest.fn();
    const formObserver = form.observe(mockFn).focus();

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
