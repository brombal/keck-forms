import { focus, observe } from 'keck';
import { KeckForm } from 'keck-forms/KeckForm';
import { zodValidator } from 'keck-forms/zodValidator';
import { vi } from 'vitest';
import { z } from 'zod';

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
        // @ts-expect-error expected to fail on unknown fields
        input.asdf;
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

    const form = observe(
      new KeckForm({
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
      }),
    );

    const mockFn = vi.fn();
    const formObserver = observe(form, { focusable: true, onChange: mockFn });
    const { commit } = focus(formObserver);

    void formObserver.field('age').isValid;
    commit();

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
      name: '',
      age: 20,
      friends: [
        { name: '', age: 30 },
        { name: '', age: 15 },
      ],
    };

    const form = new KeckForm({
      initial,
      validate: zodValidator(
        z.object({
          name: z.string().min(1, 'Name is required'),
          age: z.number().min(18),
          friends: z.array(
            z.object({
              name: z.string().min(1, 'Friend name is required'),
              age: z.number().min(18, 'Friend must be 18 or older'),
            }),
          ),
        }),
      ),
    });

    expect(form.isValid).toBe(false);
    expect(form.field('friends.0.name').errors).toEqual(['Friend name is required']);
    expect(form.field('friends.0.age').errors).toEqual([]);
    expect(form.field('friends.1.name').errors).toEqual(['Friend name is required']);
    expect(form.field('friends.1.age').errors).toEqual(['Friend must be 18 or older']);
    expect(form.field('friends.1').errors).toEqual([]);
    expect(form.field('friends.1').allErrors).toEqual([
      { path: 'friends.1.name', errors: ['Friend name is required'] },
      { path: 'friends.1.age', errors: ['Friend must be 18 or older'] },
    ]);
    expect(form.field('friends').errors).toEqual([]);
    expect(form.field('friends').allErrors).toEqual([
      { path: 'friends.0.name', errors: ['Friend name is required'] },
      { path: 'friends.1.name', errors: ['Friend name is required'] },
      { path: 'friends.1.age', errors: ['Friend must be 18 or older'] },
    ]);
    expect(form.errors).toEqual([]);
    expect(form.allErrors).toEqual([
      { path: 'name', errors: ['Name is required'] },
      { path: 'friends.0.name', errors: ['Friend name is required'] },
      { path: 'friends.1.name', errors: ['Friend name is required'] },
      { path: 'friends.1.age', errors: ['Friend must be 18 or older'] },
    ]);
  });

  test('Set mutations trigger validation', () => {
    const form = new KeckForm({
      initial: { tags: new Set<string>() },
      validate: (input, setError) => {
        if (input.tags.size === 0) setError('tags', 'At least one tag required');
        return input;
      },
    });

    expect(form.isValid).toBe(false);

    form.field('tags').value.add('typescript');
    expect(form.isValid).toBe(true);

    form.field('tags').value.clear();
    expect(form.isValid).toBe(false);

    form.field('tags').value.add('javascript');
    form.field('tags').value.delete('javascript');
    expect(form.isValid).toBe(false);
  });

  test('setError with unshift action prepends to the error list', () => {
    const form = new KeckForm({
      initial: { age: 10 },
      validate: (input, setError) => {
        setError('age', 'first error');
        setError('age', 'prepended error', 'unshift');
        return input;
      },
    });
    expect(form.field('age').errors).toEqual(['prepended error', 'first error']);
  });

  test('setError with replace action discards earlier errors for that field', () => {
    const form = new KeckForm({
      initial: { age: 20 },
      validate: (input, setError) => {
        setError('age', 'first error');
        setError('age', 'final error', 'replace');
        return input;
      },
    });
    expect(form.field('age').errors).toEqual(['final error']);
  });

  test('setError with null clears an error previously set in the same run', () => {
    const form = new KeckForm({
      initial: { age: 10 },
      validate: (input, setError) => {
        if (input.age < 18) setError('age', 'must be 18+');
        if (input.age >= 18) setError('age', null); // explicitly clear
        return input;
      },
    });

    expect(form.field('age').errors).toEqual(['must be 18+']);

    form.field('age').value = 20;
    expect(form.field('age').errors).toEqual([]);
  });

  test('allErrors on object field does not include errors from fields with a matching path prefix', () => {
    const form = new KeckForm({
      initial: { profile: { bio: '' }, profileUrl: '' },
      validate: (input, setError) => {
        setError('profile.bio', 'Bio is required');
        setError('profileUrl', 'URL is required');
        return input;
      },
    });

    // 'profile' allErrors should only contain 'profile.bio', not 'profileUrl'
    expect(form.field('profile').allErrors).toEqual([
      { path: 'profile.bio', errors: ['Bio is required'] },
    ]);
  });

  test('allErrors on array field does not include errors from fields with a matching path prefix', () => {
    const form = new KeckForm({
      initial: { items: [{ name: '' }], itemsCount: 0 },
      validate: (input, setError) => {
        setError('items.0.name', 'Name is required');
        setError('itemsCount', 'Count is required');
        return input;
      },
    });

    // 'items' allErrors should only contain 'items.0.name', not 'itemsCount'
    expect(form.field('items').allErrors).toEqual([
      { path: 'items.0.name', errors: ['Name is required'] },
    ]);
  });

  test('Array mutations trigger validation', () => {
    const form = new KeckForm({
      initial: { items: [] as string[] },
      validate: (input, setError) => {
        if (input.items.length === 0) setError('items', 'At least one item required');
        return input;
      },
    });

    expect(form.isValid).toBe(false);

    form.field('items').value.push('hello');
    expect(form.isValid).toBe(true);

    form.field('items').value.splice(0, 1);
    expect(form.isValid).toBe(false);
  });
});
