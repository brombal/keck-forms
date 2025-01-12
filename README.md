# Keck Forms

Keck Forms is a **simple, type-safe React library for managing form state**. It emphasizes a clean, ergonomic developer experience, enabling you to handle deeply nested forms and validation with minimal boilerplate.

## Features

- **Type-Safe Form Management**: Use TypeScript to ensure your forms are strongly typed.
- **Nested Form State Handling**: Work with deeply nested form structures and arrays for repeated form sections without breaking a sweat.
- **Flexible Validation**: Bring your favorite validation libraries or use custom validation methods.
- **Reusable Components**: Easily create reusable input components to use across your application.

---

## Installation

```bash
npm install keck-forms
```

---

## Quick Start

Here’s a simple form example to get you started:

```tsx
import React from "react";
import { useForm, zodValidator } from "keck-forms";
import { z } from "zod";

// Define your form schema for validation
const schema = z.object({
  name: z.string().nonempty("Name is required"),
  age: z.number().min(0, "Age must be positive"),
});

// Define initial form data
const initialData = { name: "", age: 0 };

function App() {
  // Create a Keck Form 
  const { form, field, FormProvider } = useForm({
    initial: initialData,
    validate: zodValidator(schema),
  });

  return (
    <FormProvider>
      <form 
        onSubmit={() => {
          console.log(form.values);
        }}
      >
        <input
          value={field("name").value}
          onChange={(e) => (field("name").value = e.target.value)}
          onBlur={() => (field("name").touched = true)}
        />
        {field("name").errors.map((error) => (
          <div key={error}>{error}</div>
        ))}

        <input
          type="number"
          value={field("age").value}
          onChange={(e) => (field("age").value = parseInt(e.target.value, 10))}
          onBlur={() => (field("age").touched = true)}
        />
        {field("age").errors.map((error) => (
          <div key={error}>{error}</div>
        ))}
        
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

---

## Guide

### 1. Setting Up Your Form

To set up a form, define your data schema and initial values. You can use Zod or write a custom validation function.

```tsx
import { z } from "zod";

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
});
const initialData = { name: "", email: "" };
```

### 2. Creating the Form Context

Use the `useForm` hook to initialize the form. Wrap your form fields in a `FormProvider` to provide context.

```tsx
import { useForm } from "keck-forms";

const { field, FormProvider } = useForm({
  initial: initialData,
  validate: zodValidator(schema),
});
```

### 3. Binding Inputs to Form Fields

Access fields using the `field()` function. Bind their `value`, `onChange`, and `onBlur` handlers.

```tsx
<input
  value={field("name").value}
  onChange={(e) => (field("name").value = e.target.value)}
  onBlur={() => (field("name").touched = true)}
/>
```

### 4. Handling Arrays

For array fields, use array-specific operations like `push`, `remove`, or `map`.

```tsx
const skillsField = field("skills"); // e.g., [{ name: '', level: 'beginner' }]
skillsField.push({ name: "", level: "beginner" });
skillsField.map((skillField, index) => (
  <input
    key={index}
    value={skillField.value.name}
    onChange={(e) => (skillField.value.name = e.target.value)}
  />
));
```

---

## Advanced Examples

### Nested Fields

Keck Forms supports deeply nested fields seamlessly.

```tsx
field("profile.name").value = "John Doe";
field("profile.contact.email").value = "john.doe@example.com";
```

### Reusable Components

Encapsulate field logic in reusable components.

```tsx
function TextField({ fieldPath }: { fieldPath: string }) {
  const { field } = useFormContext();
  const fieldData = field(fieldPath);

  return (
    <>
      <input
        value={fieldData.value}
        onChange={(e) => (fieldData.value = e.target.value)}
        onBlur={() => (fieldData.touched = true)}
      />
      {fieldData.errors.map((error) => (
        <div key={error}>{error}</div>
      ))}
    </>
  );
}
```

---

## API Reference

### `useForm`

```tsx
function useForm<TInput extends object, TOutput extends object>(options: {
  initial: TInput;
  validate: FormValidatorFn<TInput, TOutput>;
}): {
  form: TOutput;
  field: GetFormFieldFn<TInput>;
  FormProvider: React.FC<{ children: React.ReactNode[] }>;
};
```

**Arguments**:

- `initial`: The initial form state.
- `validate`: A function or schema to validate the form.

**Returns**:

- `form`: The current validated output of the form.
- `field`: A function to get or manipulate specific fields.
- `FormProvider`: A context provider for the form.

---

### `field()`

```tsx
function field<TPath extends StringPath<TInput>>(
  path: TPath,
): KeckFieldForPath<TInput, TPath>;
```

**Arguments**:

- `path`: The dot-separated path to the field.

**Returns**:

- Field object with properties like `value`, `errors`, `touched`, and methods for arrays or nested objects.

---

### Array Field Methods

- `push(value)`: Add a new item to the array.
- `remove(index)`: Remove an item by index.
- `map(callback)`: Iterate over items in the array.

---

Keck Forms makes form state management simple, type-safe, and efficient. [Get started now!](#)
