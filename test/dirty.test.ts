import { jest } from '@jest/globals';
import { KeckForm } from 'keck-forms/KeckForm';

describe('dirty', () => {
  test("Form values should be dirty when they don't match initial", () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    expect(form.field('name').dirty).toBe(false);
    expect(form.field('age').dirty).toBe(false);
    expect(form.field('friends').dirty).toBe(false);
    expect(form.field('').dirty).toBe(false);

    form.field('name').value = 'Jane';

    expect(form.field('name').dirty).toBe(true);
    expect(form.field('age').dirty).toBe(false);
    expect(form.field('friends').dirty).toBe(false);
    expect(form.field('').dirty).toBe(true);

    form.field('friends.0.name').value = 'Bob';

    expect(form.field('friends.0.name').dirty).toBe(true);
    expect(form.field('friends.0').dirty).toBe(true);
    expect(form.field('friends').dirty).toBe(true);
    expect(form.field('').dirty).toBe(true);
  });

  test('Observer callback is only triggered when dirty state changes', () => {
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

    // Observe dirty value
    void formObserver.field('name').dirty;

    // Changing value should trigger callback
    form.field('name').value = 'Jane';
    expect(mockFn).toHaveBeenCalledTimes(1);

    mockFn.mockReset();

    // Changing value again should not trigger callback
    form.field('name').value = 'Bob';
    expect(mockFn).toHaveBeenCalledTimes(0);
  });
});
