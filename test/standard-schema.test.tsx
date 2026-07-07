import { act, renderHook } from '@testing-library/react';
import { KeckForm } from 'keck-forms/KeckForm';
import type { StandardSchemaV1 } from 'keck-forms/standardSchema';
import { standardSchemaValidator } from 'keck-forms/standardSchemaValidator';
import { useForm } from 'keck-forms/useForm';
import { z } from 'zod';

describe('standardSchemaValidator', () => {
  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    age: z
      .string()
      .nullable()
      .transform((v) => Number(v ?? 0)),
  });

  test('returns the schema output on success', () => {
    const validator = standardSchemaValidator(schema);
    const output = validator({ name: 'John', age: '42' }, () => {});
    expect(output).toEqual({ name: 'John', age: 42 });
  });

  test('maps issues to dot-joined field paths and returns null on failure', () => {
    const validator = standardSchemaValidator(schema);
    const errors: Record<string, string> = {};
    const output = validator({ name: '', age: null }, (field, error) => {
      errors[field] = error as string;
    });
    expect(output).toBeNull();
    expect(errors).toEqual({ name: 'Name is required' });
  });

  test('maps nested and PathSegment-object paths', () => {
    // A hand-rolled Standard Schema producing both plain-key and {key} path segments
    const custom: StandardSchemaV1<{ items: { label: string }[] }> = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: () => ({
          issues: [
            { message: 'plain path', path: ['items', 0, 'label'] },
            { message: 'segment path', path: [{ key: 'items' }, { key: 1 }, { key: 'label' }] },
          ],
        }),
      },
    };
    const validator = standardSchemaValidator(custom);
    const errors: Record<string, string> = {};
    validator({ items: [] }, (field, error) => {
      errors[field] = error as string;
    });
    expect(errors).toEqual({
      'items.0.label': 'plain path',
      'items.1.label': 'segment path',
    });
  });

  test('throws a clear error for async schemas', () => {
    const asyncSchema: StandardSchemaV1<{ name: string }> = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: async () => ({ value: { name: '' } }),
      },
    };
    const validator = standardSchemaValidator(asyncSchema);
    expect(() => validator({ name: '' }, () => {})).toThrow(/async validation is not supported/);
  });
});

describe('KeckForm schema option', () => {
  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
  });

  test('validates via the schema', () => {
    const form = new KeckForm({ initial: { name: '' }, schema });
    expect(form.isValid).toBe(false);
    expect(form.field('name').errors).toEqual(['Name is required']);
    form.field('name').value = 'John';
    expect(form.isValid).toBe(true);
    expect(form.output).toEqual({ name: 'John' });
  });

  test('an explicit validate function takes precedence over schema', () => {
    const form = new KeckForm({
      initial: { name: '' },
      schema,
      validate: (input) => ({ name: `custom:${input.name}` }),
    });
    expect(form.isValid).toBe(true);
    expect(form.output).toEqual({ name: 'custom:' });
  });
});

describe('useForm schema option', () => {
  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    dob: z
      .string()
      .nullable()
      .transform((v) => ({ year: Number(v) })),
  });

  test('validates and submits with schema-derived output', async () => {
    let submitted: unknown;
    const { result } = renderHook(() =>
      useForm({
        // Narrower than z.input (dob: string vs string | null) -- satisfies-semantics
        initial: { name: 'John', dob: '1990' },
        schema,
        onSubmit(output) {
          // output is typed from the schema: { name: string; dob: { year: number } }
          submitted = { name: output.name, year: output.dob.year };
        },
      }),
    );

    expect(result.current.form.isValid).toBe(true);
    await act(() => result.current.form.handleSubmit());
    expect(submitted).toEqual({ name: 'John', year: 1990 });
  });

  test('supports a widened form input type via explicit type arguments', async () => {
    const narrowSchema = z.object({
      name: z.string().min(1, 'Name is required'),
    });
    // Form state is wider than the schema input: an extra UI-only field.
    type WideInput = { name: string; uiOnlyFlag: boolean };

    let submitted: unknown;
    const { result } = renderHook(() =>
      useForm<typeof narrowSchema, WideInput>({
        initial: { name: 'John', uiOnlyFlag: true },
        schema: narrowSchema,
        onSubmit(output) {
          // output is schema-driven; input fields keep the wide type
          submitted = output.name;
        },
      }),
    );

    // Widened field paths are available and typed
    expect(result.current.form.field('uiOnlyFlag').value).toBe(true);
    expect(result.current.form.isValid).toBe(true);
    await act(() => result.current.form.handleSubmit());
    expect(submitted).toBe('John');
  });

  test('reports schema errors on fields', () => {
    const { result } = renderHook(() =>
      useForm({
        initial: { name: '', dob: '' },
        schema,
      }),
    );
    expect(result.current.form.isValid).toBe(false);
    expect(result.current.form.field('name').errors).toEqual(['Name is required']);
  });
});
