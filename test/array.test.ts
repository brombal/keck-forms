import { focus, observe } from 'keck';
import { KeckFieldArray } from 'keck-forms/KeckFieldArray';
import { KeckForm } from 'keck-forms/KeckForm';
import { standardSchemaValidator } from 'keck-forms/standardSchemaValidator';
import { vi } from 'vitest';
import { z } from 'zod';

type Friend = { name: string; age: number };
type FormShape = { friends: Friend[] };

const initial: FormShape = {
  friends: [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 40 },
    { name: 'Charlie', age: 50 },
  ],
};

function makeForm(overrideInitial?: FormShape) {
  return new KeckForm({ initial: overrideInitial ?? initial, validate: (input) => input });
}

describe('array', () => {
  test('form.field() returns KeckFieldArray for array fields', () => {
    const form = makeForm();
    expect(form.field('friends')).toBeInstanceOf(KeckFieldArray);
  });

  describe('map()', () => {
    test('returns a value for each element', () => {
      const form = makeForm();
      const names = form.field('friends').map((f) => f.field('name').value);
      expect(names).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    test('on empty array returns []', () => {
      const form = makeForm({ friends: [] });
      expect(form.field('friends').map(() => null)).toEqual([]);
    });

    test('provides correct index to callback', () => {
      const form = makeForm();
      const indices: number[] = [];
      form.field('friends').map((_, i) => indices.push(i));
      expect(indices).toEqual([0, 1, 2]);
    });
  });

  describe('push()', () => {
    test('appends an element and leaves it untouched', () => {
      const form = makeForm();
      form.field('friends.0.name').touched = true;

      form.field('friends').push({ name: 'Dave', age: 25 });

      expect(form.field('friends').value).toHaveLength(4);
      expect(form.field('friends.3.name').value).toBe('Dave');
      expect(form.field('friends.3.name').touched).toBe(false);
      expect(form.field('friends.0.name').touched).toBe(true); // unchanged
    });
  });

  describe('pop()', () => {
    test('removes the last element and returns it', () => {
      const form = makeForm();
      const result = form.field('friends').pop();
      expect(result).toEqual({ name: 'Charlie', age: 50 });
      expect(form.field('friends').value).toHaveLength(2);
    });

    test('clears touched state of removed last element', () => {
      const form = makeForm();
      form.field('friends.2.name').touched = true;

      form.field('friends').pop();

      expect(form.field('friends').touched).toBe(false);
      expect(form.touched).toBe(false);
    });

    test('does not affect touched state of remaining elements', () => {
      const form = makeForm();
      form.field('friends.0.name').touched = true;
      form.field('friends.2.name').touched = true;

      form.field('friends').pop();

      expect(form.field('friends.0.name').touched).toBe(true);
    });
  });

  describe('remove()', () => {
    test('removes an element by index', () => {
      const form = makeForm();
      form.field('friends').remove(1);
      expect(form.field('friends').value).toHaveLength(2);
      expect(form.field('friends.0.name').value).toBe('Alice');
      expect(form.field('friends.1.name').value).toBe('Charlie');
    });

    test('shifts touched indices after remove', () => {
      const form = makeForm();
      form.field('friends.1.name').touched = true;
      form.field('friends.2.name').touched = true;

      form.field('friends').remove(0);

      // old index 1 → now index 0
      expect(form.field('friends.0.name').touched).toBe(true);
      // old index 2 → now index 1
      expect(form.field('friends.1.name').touched).toBe(true);
    });

    test('clears touched state when removing the only touched row', () => {
      const form = makeForm();
      form.field('friends.1.name').touched = true;

      form.field('friends').remove(1);

      expect(form.field('friends').touched).toBe(false);
      expect(form.touched).toBe(false);
    });

    test('removing an untouched row does not affect touched state of others', () => {
      const form = makeForm();
      form.field('friends.2.name').touched = true;

      form.field('friends').remove(0);

      // old index 2 → now index 1
      expect(form.field('friends.1.name').touched).toBe(true);
    });
  });

  describe('shift()', () => {
    test('removes and returns the first element', () => {
      const form = makeForm();
      const result = form.field('friends').shift();
      expect(result).toEqual({ name: 'Alice', age: 30 });
      expect(form.field('friends').value).toHaveLength(2);
      expect(form.field('friends.0.name').value).toBe('Bob');
    });

    test('shifts touched indices after shift', () => {
      const form = makeForm();
      form.field('friends.1.name').touched = true;

      form.field('friends').shift();

      // old index 1 → now index 0
      expect(form.field('friends.0.name').touched).toBe(true);
    });
  });

  describe('unshift()', () => {
    test('adds an element at the start', () => {
      const form = makeForm();
      form.field('friends').unshift({ name: 'Dave', age: 25 });
      expect(form.field('friends').value).toHaveLength(4);
      expect(form.field('friends.0.name').value).toBe('Dave');
    });

    test('shifts touched indices after unshift', () => {
      const form = makeForm();
      form.field('friends.0.name').touched = true;

      form.field('friends').unshift({ name: 'Dave', age: 25 });

      // new element at 0 is untouched
      expect(form.field('friends.0.name').touched).toBe(false);
      // old index 0 → now index 1
      expect(form.field('friends.1.name').touched).toBe(true);
    });
  });

  describe('insert()', () => {
    test('inserts an element at the given index', () => {
      const form = makeForm();
      form.field('friends').insert(1, { name: 'Dave', age: 25 });
      expect(form.field('friends').value).toHaveLength(4);
      expect(form.field('friends.1.name').value).toBe('Dave');
      expect(form.field('friends.2.name').value).toBe('Bob');
    });

    test('shifts touched indices after insert', () => {
      const form = makeForm();
      form.field('friends.0.name').touched = true;

      form.field('friends').insert(0, { name: 'Dave', age: 25 });

      // inserted element at 0 is untouched
      expect(form.field('friends.0.name').touched).toBe(false);
      // old index 0 → now index 1
      expect(form.field('friends.1.name').touched).toBe(true);
    });
  });

  describe('swap()', () => {
    test('swaps values at two indices', () => {
      const form = makeForm();
      form.field('friends').swap(0, 2);
      expect(form.field('friends.0.name').value).toBe('Charlie');
      expect(form.field('friends.2.name').value).toBe('Alice');
      expect(form.field('friends.1.name').value).toBe('Bob'); // unchanged
    });

    test('swaps touched states along with values', () => {
      const form = makeForm();
      form.field('friends.0.name').touched = true;
      // index 2 is untouched

      form.field('friends').swap(0, 2);

      // index 2 is now where index 0 was (touched)
      expect(form.field('friends.2.name').touched).toBe(true);
      // index 0 is now where index 2 was (untouched)
      expect(form.field('friends.0.name').touched).toBe(false);
    });
  });

  describe('clear()', () => {
    test('removes all elements', () => {
      const form = makeForm();
      form.field('friends').clear();
      expect(form.field('friends').value).toHaveLength(0);
    });

    test('clears all touched state', () => {
      const form = makeForm();
      form.field('friends.0.name').touched = true;
      form.field('friends.2.name').touched = true;

      form.field('friends').clear();

      expect(form.field('friends').touched).toBe(false);
      expect(form.touched).toBe(false);
    });
  });

  describe('allErrors observability', () => {
    test('allErrors comparator suppresses observer when array errors are unchanged', () => {
      // This test exercises the JSON.stringify comparator in allErrors. Without it, every
      // validation run (even for unrelated fields) would fire all allErrors observers.
      const form = observe(
        new KeckForm<{ name: string; friends: Friend[] }>({
          initial: { name: 'valid', friends: initial.friends },
          validate: standardSchemaValidator(
            z.object({
              name: z.string().min(1),
              friends: z.array(z.object({ name: z.string().min(1), age: z.number() })),
            }),
          ),
        }),
      );

      const mockFn = vi.fn();
      const formObserver = observe(form, { focusable: true, onChange: mockFn });
      const { commit } = focus(formObserver);
      void formObserver.field('friends').allErrors;
      commit();

      // Invalidating an unrelated field triggers re-validation but friends errors are unchanged.
      // The comparator returns true, so the observer is NOT notified.
      form.field('name').value = '';
      expect(mockFn).toHaveBeenCalledTimes(0);

      // Invalidating a friends field changes friends.allErrors.
      // The comparator returns false, so the observer IS notified.
      form.field('friends.0.name').value = '';
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('mutations with array-level touched', () => {
    test('remove() with array-level touched leaves remaining elements touched', () => {
      // When form.field('friends').touched = true, $touched.friends is set to the scalar
      // `true` rather than a per-element array. Mutations should leave that sentinel intact
      // so remaining elements are still considered touched.
      const form = makeForm();
      form.field('friends').touched = true;

      form.field('friends').remove(1);

      expect(form.field('friends').value).toHaveLength(2);
      expect(form.field('friends.0').touched).toBe(true);
      expect(form.field('friends.1').touched).toBe(true);
    });
  });

  describe('errors stay correct after mutations', () => {
    const validatedForm = () =>
      new KeckForm({
        initial,
        validate: standardSchemaValidator(
          z.object({
            friends: z.array(
              z.object({ name: z.string().min(1, 'Name required'), age: z.number().min(0) }),
            ),
          }),
        ),
      });

    test('errors are recomputed after remove()', () => {
      const form = validatedForm();
      form.field('friends').push({ name: '', age: 15 });
      expect(form.isValid).toBe(false);

      form.field('friends').remove(3);
      expect(form.isValid).toBe(true);
    });

    test('errors are recomputed after clear()', () => {
      const form = validatedForm();
      form.field('friends').push({ name: '', age: -1 });
      expect(form.isValid).toBe(false);

      form.field('friends').clear();
      expect(form.isValid).toBe(true);
    });
  });
});
