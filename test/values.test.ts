import { KeckForm } from 'keck-forms/KeckForm';

describe('values', () => {
  test('values should get/set correctly', () => {
    const form = new KeckForm({
      initial: { name: 'John', age: 20 },
      validate: () => ({}),
    });

    expect(form.field('').value).toEqual({ name: 'John', age: 20 });
    expect(form.field('name').value).toBe('John');
    expect(form.field('age').value).toBe(20);

    form.field('name').value = 'Jane';
    expect(form.field('name').value).toBe('Jane');

    form.field('age').value = 30;
    expect(form.field('age').value).toBe(30);
  });

  test('values should have correct TS types', () => {
    const form = new KeckForm({
      initial: { name: 'John', age: 20, friends: [{ name: 'Alice', age: 30 }] },
      validate: () => ({}),
    });

    // string
    form.field('name').value.toLowerCase();
    // @ts-expect-error
    void form.field('name').value.toFixed;

    // number
    form.field('age').value.toFixed();
    // @ts-expect-error
    void form.field('age').value.toLowerCase;

    // array
    form.field('friends').value.push({ name: 'Bob', age: 50 });
    // @ts-expect-error
    void form.field('friends').value.toFixed;

    // object
    form.field('friends.0').value.name.toLowerCase();
    // @ts-expect-error
    void form.field('friends.0').value.toFixed;
  });

  test('deep/array values should get/set correctly', () => {
    const values = {
      name: 'John',
      age: 20,
      friends: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 40 },
      ],
    };

    const form = new KeckForm({
      initial: values,
      validate: () => ({}),
    });

    expect(form.field('friends').value).toEqual(values.friends);
    expect(form.field('friends.0').value).toEqual(values.friends[0]);
    expect(form.field('friends.1').value).toEqual(values.friends[1]);
    expect(form.field('friends.0.name').value).toBe('Alice');
    expect(form.field('friends.0.age').value).toBe(30);
    expect(form.field('friends.1.name').value).toBe('Bob');
    expect(form.field('friends.1.age').value).toBe(40);

    form.field('friends.0.name').value = 'Alice2';
    expect(form.field('friends.0.name').value).toBe('Alice2');

    form.field('friends.1.age').value = 50;
    expect(form.field('friends.1.age').value).toBe(50);

    form.field('friends.1').value = { name: 'Bob2', age: 60 };
    expect(form.field('friends.1.name').value).toBe('Bob2');

    form.field('friends').value = { '0': { name: 'Alice3', age: 20 } } as any;
    expect(form.field('friends.0.name').value).toBe('Alice3');
    expect(form.field('friends.0.age').value).toBe(20);
  });
});
