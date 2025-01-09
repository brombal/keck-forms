import { jest } from '@jest/globals';
import { KeckForm } from 'keck-forms/KeckForm';

describe('output', () => {
  test('Form output matches validation result', () => {
    const initial = {
      name: 'John',
      age: '20' as string | number,
    };

    const form = new KeckForm({
      initial,
      validate: (input) => {
        input.age = Number(input.age);
        return input as { name: string; age: number };
      },
    });

    expect(form.output).toEqual({
      name: 'John',
      age: 20,
    });
  });

  test('Output is observable', () => {
    const initial = {
      name: 'John',
      age: '20' as string | number,
    };

    const form = new KeckForm({
      initial,
      validate: (input) => {
        input.age = Number(input.age);
        return input as { name: string; age: number };
      },
    });

    const mockFn = jest.fn();
    const formObserver = form.observe(mockFn).focus();

    // observe name field only
    void formObserver.output.name;

    form.field('name').value = 'Jane';
    expect(mockFn).toHaveBeenCalledTimes(1);
    mockFn.mockReset();

    form.field('age').value = '21';
    /**
     * This should really be 0, but since the result of the validation function completely replaces
     * the form's output object, and the current implementation of the underlying observability
     * library (keck) does not support property-specific observations when an ancestor object is
     * replaced, the callback is called whenever the output changes.
     */
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
