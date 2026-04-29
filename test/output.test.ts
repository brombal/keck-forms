import { observe } from 'keck';
import { KeckForm } from 'keck-forms/KeckForm';
import { vi } from 'vitest';

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

    const form = observe(
      new KeckForm({
        initial,
        validate: (input) => {
          input.age = Number(input.age);
          return input as { name: string; age: number };
        },
      }),
    );

    const mockFn = vi.fn();
    const formObserver = observe(form, mockFn);

    // observe name field only
    void formObserver.output?.name;

    form.field('name').value = 'Jane';
    /**
     * Called twice: once when $values.name changes (setter's atomic), and once when _output
     * changes (the deep observer fires after the atomic and runs validate(), updating _output
     * in a separate atomic). Both fire on the unfocused formObserver's root observation.
     */
    expect(mockFn).toHaveBeenCalledTimes(2);
    mockFn.mockReset();

    form.field('age').value = '21';
    // Same double-trigger behavior as above.
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
