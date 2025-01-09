import { jest } from '@jest/globals';
import { focus } from 'keck';
import { KeckForm } from 'keck-forms/KeckForm';

describe('KeckForm', () => {
  it('should work', () => {
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: () => ({}),
    });

    // @ts-expect-error - unknown field
    form.field('unknown');

    const nameField = form.field('name');
    expect(nameField.value).toBe('John');

    nameField.value = 'Jane';
    expect(nameField.value).toBe('Jane');
  });

  it('should have observable field values', () => {
    const form = new KeckForm({
      initial: { name: 'John', age: 20 },
      validate: () => ({}),
    });

    const mockFn = jest.fn();

    // Use the .observe method to observe the form with a callback.
    const formObserver = form.observe(mockFn);

    // Focus the formObserver to start observing changes to specific properties
    // (You could omit this to observe all changes to the form values, errors, and other state.)
    focus(formObserver);

    // Use the observer's `.field` method to get a specific field, and access its value to start observing changes to it.
    const nameField = formObserver.field('name');
    void nameField.value;

    // A change to an unobserved field value will not trigger the callback.
    form.field('age').value = 10;
    expect(mockFn).toHaveBeenCalledTimes(0);

    // A change to an observed field value will trigger the callback.
    form.field('name').value = 'Jane';
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
