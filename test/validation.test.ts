import { jest } from '@jest/globals';
import { KeckForm } from 'keck-forms/KeckForm';

describe('validation', () => {
  test('Basic validation works', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = new KeckForm({
      initial,
      validate: (input, setError) => {
        if (input.age < 18) {
          setError('age', 'You must be 18 or older');
        }
        if (input.friends.length === 0) {
          setError('friends', 'You must have at least one friend');
        }
        return input;
      },
    });

    expect(form.isValid).toBe(true);

    form.field('age').value = 17;
    expect(form.isValid).toBe(false);
    expect(form.field('age').errors).toEqual(['You must be 18 or older']);

    form.field('friends').value = [];
    expect(form.isValid).toBe(false);
    expect(form.field('friends').errors).toEqual(['You must have at least one friend']);
  });

  test('Observer callback is only triggered when error state changes', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = new KeckForm({
      initial,
      validate: (input, setError) => {
        if (input.age < 18) {
          setError('age', 'You must be 18 or older');
        }
        if (input.age % 2 === 1) {
          setError('age', 'Age must be even');
        }
        if (input.friends.length === 0) {
          setError('friends', 'You must have at least one friend');
        }
        return input;
      },
    });

    const mockFn = jest.fn();
    const formObserver = form.observe(mockFn).focus();

    void formObserver.field('age').isValid;

    form.field('age').value = 16;
    expect(mockFn).toHaveBeenCalledTimes(1);

    mockFn.mockReset();

    form.field('age').value = 17;
    expect(mockFn).toHaveBeenCalledTimes(0);

    mockFn.mockReset();

    form.field('age').value = 28;
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('Errors are returned for all sub fields', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 15 },
      ],
    };

    const form = new KeckForm({
      initial,
      validate: (input, setError) => {
        for (const i in input.friends) {
          if (input.friends[i].age < 18) {
            setError(`friends.${+i}.age`, 'Friend must be 18 or older');
          }
        }
        return input;
      },
    });

    expect(form.isValid).toBe(false);
    expect(form.field('friends.1.age').errors).toEqual(['Friend must be 18 or older']);
    expect(form.field('friends.1').errors).toEqual(['Friend must be 18 or older']);
    expect(form.field('friends').errors).toEqual(['Friend must be 18 or older']);

    form.field('friends.0.age').value = 15;
    expect(form.field('friends').errors).toEqual([
      'Friend must be 18 or older',
      'Friend must be 18 or older',
    ]);
  });
});
