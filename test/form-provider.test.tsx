import { act, render, screen } from '@testing-library/react';
import { FormProvider } from 'keck-forms/FormProvider';
import { KeckForm } from 'keck-forms/KeckForm';
import { standardSchemaValidator } from 'keck-forms/standardSchemaValidator';
import { useFormContext } from 'keck-forms/useFormContext';
import { z } from 'zod';

describe('FormProvider (standalone)', () => {
  test('provides an externally-created KeckForm to useFormContext', () => {
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: standardSchemaValidator(z.object({ name: z.string() })),
    });

    function NameDisplay() {
      const contextForm = useFormContext<{ name: string }>();
      return <div data-testid="name">{contextForm.field('name').value}</div>;
    }

    render(
      <FormProvider form={form}>
        <NameDisplay />
      </FormProvider>,
    );

    expect(screen.getByTestId('name').textContent).toBe('John');
  });

  test('components re-render when the external form changes', () => {
    const form = new KeckForm({
      initial: { name: 'John' },
      validate: standardSchemaValidator(z.object({ name: z.string() })),
    });

    function NameDisplay() {
      const contextForm = useFormContext<{ name: string }>();
      return <div data-testid="name">{contextForm.field('name').value}</div>;
    }

    render(
      <FormProvider form={form}>
        <NameDisplay />
      </FormProvider>,
    );

    act(() => {
      form.field('name').value = 'Jane';
    });

    expect(screen.getByTestId('name').textContent).toBe('Jane');
  });
});
