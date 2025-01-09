import { jest } from '@jest/globals';
import { KeckForm } from 'keck-forms/KeckForm';

describe('observability', () => {
  test('field values should be observable', () => {
    const form = new KeckForm({
      initial: { name: 'John', age: 20 },
      validate: () => ({}),
    });

    const mockFn = jest.fn();

    // Use the .observe method to observe the form with a callback.
    const formObserver = form.observe(mockFn);

    // Focus the formObserver to start observing changes to specific properties
    formObserver.focus();

    // Use the observer's `.field` method to get a specific field and access its value to start observing changes to it.
    formObserver.field('name').value;

    // A change to an unobserved field value will not trigger the callback.
    form.field('age').value = 10;
    expect(mockFn).toHaveBeenCalledTimes(0);

    // A change to an observed field value will trigger the callback.
    form.field('name').value = 'Jane';
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
