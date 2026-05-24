import { focus, observe } from 'keck';
import { KeckForm, reassignOptions } from 'keck-forms/KeckForm';
import { zodValidator } from 'keck-forms/zodValidator';
import { vi } from 'vitest';
import { z } from 'zod';

describe('observability', () => {
  test('field values should be observable', () => {
    const form = observe(
      new KeckForm({
        initial: { name: 'John', age: 20 },
        validate: () => ({}),
      }),
    );

    const mockFn = vi.fn();

    // Use the .observe method to observe the form with a callback.
    const formObserver = observe(form, { focusable: true, onChange: mockFn });
    // Focus the formObserver to start observing changes to specific properties
    const { commit: commit1 } = focus(formObserver);

    // Use the observer's `.field` method to get a specific field and access its value to start observing changes to it.
    formObserver.field('name').value;
    commit1();

    // A change to an unobserved field value will not trigger the callback.
    form.field('age').value = 10;
    expect(mockFn).toHaveBeenCalledTimes(0);

    // A change to an observed field value will trigger the callback.
    form.field('name').value = 'Jane';
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('Correct validate function should be called when replaced', () => {
    const mockValidateFn = vi.fn();

    const form = observe(
      new KeckForm({
        initial: { name: 'John', age: 20 },
        validate: mockValidateFn,
      }),
    );

    const mockObserveFn = vi.fn();

    // Use the .observe method to observe the form with a callback.
    const formObserver = observe(form, { focusable: true, onChange: mockObserveFn });
    // Focus the formObserver to start observing changes to specific properties
    const { commit: commit2 } = focus(formObserver);

    // Use the observer's `.field` method to get a specific field and access its value to start observing changes to it.
    formObserver.field('name').value;
    commit2();

    // A change to an unobserved field value will not trigger the callback.
    vi.resetAllMocks();
    formObserver.field('age').value = 10;
    expect(mockValidateFn).toHaveBeenCalledTimes(1);

    const mockValidateFn2 = vi.fn();
    form[reassignOptions]({ validate: mockValidateFn2 });

    // A change to an observed field value will trigger the callback.
    vi.resetAllMocks();
    formObserver.field('name').value = 'Jane';
    expect(mockValidateFn).toHaveBeenCalledTimes(0);
    expect(mockValidateFn2).toHaveBeenCalledTimes(1);
  });

  test('KeckField allErrors observer is suppressed when errors are unchanged', () => {
    // The JSON.stringify comparator on allErrors prevents observers from firing when
    // re-validation changes other fields but leaves this field's errors the same.
    const form = observe(
      new KeckForm({
        initial: { name: '', age: 20 },
        validate: zodValidator(z.object({ name: z.string().min(1), age: z.number().min(18) })),
      }),
    );

    const mockFn = vi.fn();
    const formObserver = observe(form, { focusable: true, onChange: mockFn });
    const { commit: commit3 } = focus(formObserver);
    void formObserver.field('name').allErrors;
    commit3();

    // Changing age triggers re-validation but name.allErrors is unchanged — comparator returns true.
    form.field('age').value = 17;
    expect(mockFn).toHaveBeenCalledTimes(0);

    // Making name valid changes name.allErrors — comparator returns false, observer fires.
    form.field('name').value = 'Alice';
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('KeckFieldObject allErrors observer is suppressed when errors are unchanged', () => {
    const form = observe(
      new KeckForm({
        initial: { name: '', address: { street: '', city: '' } },
        validate: zodValidator(
          z.object({
            name: z.string().min(1),
            address: z.object({ street: z.string().min(1), city: z.string().min(1) }),
          }),
        ),
      }),
    );

    const mockFn = vi.fn();
    const formObserver = observe(form, { focusable: true, onChange: mockFn });
    const { commit: commit4 } = focus(formObserver);
    void formObserver.field('address').allErrors;
    commit4();

    // Fixing name (unrelated) triggers re-validation but address.allErrors is unchanged.
    form.field('name').value = 'Alice';
    expect(mockFn).toHaveBeenCalledTimes(0);

    // Fixing address.street changes address.allErrors — observer fires.
    form.field('address.street').value = '123 Main St';
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('reassignOptions updates initial value', () => {
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: () => ({}),
    });

    form.field('name').value = 'Jane';
    expect(form.field('name').dirty).toBe(true);

    form[reassignOptions]({ initial: { name: 'Jane' } });
    expect(form.field('name').dirty).toBe(false); // 'Jane' now matches the new initial
  });
});
