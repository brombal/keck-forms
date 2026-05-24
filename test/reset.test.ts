import { focus, observe } from 'keck';
import { KeckForm } from 'keck-forms/KeckForm';
import { vi } from 'vitest';

describe('reset', () => {
  test('Entire form is reset', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    form.field('name').value = 'Changed';

    form.field('name').touched = true;
    form.field('friends.0.name').touched = true;

    expect(form.touched).toBe(true);
    expect(form.field('name').touched).toBe(true);
    expect(form.field('friends').touched).toBe(true);
    expect(form.field('friends.0').touched).toBe(true);
    expect(form.field('friends.0.name').touched).toBe(true);

    form.handleSubmit();
    expect(form.submitCount).toBe(1);

    form.reset();

    expect(form.field('name').value).toBe(initial.name);

    expect(form.touched).toBe(false);
    expect(form.field('name').touched).toBe(false);
    expect(form.field('friends').touched).toBe(false);
    expect(form.field('friends.0').touched).toBe(false);
    expect(form.field('friends.0.name').touched).toBe(false);

    expect(form.submitCount).toBe(0);
  });

  test('Form is partially reset', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [{ name: 'Alice', age: 30 }],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    form.field('name').value = 'Changed';

    form.field('name').touched = true;
    form.field('friends.0.name').touched = true;

    expect(form.touched).toBe(true);
    expect(form.field('name').touched).toBe(true);
    expect(form.field('friends').touched).toBe(true);
    expect(form.field('friends.0').touched).toBe(true);
    expect(form.field('friends.0.name').touched).toBe(true);

    form.handleSubmit();
    expect(form.submitCount).toBe(1);

    form.reset({ values: true });

    expect(form.field('name').value).toBe(initial.name);
    expect(form.touched).toBe(true);
    expect(form.submitCount).toBe(1);

    form.reset({ touched: true });

    expect(form.field('name').value).toBe(initial.name);
    expect(form.touched).toBe(false);
    expect(form.submitCount).toBe(1);

    form.reset({ submit: true });

    expect(form.field('name').value).toBe(initial.name);
    expect(form.touched).toBe(false);
    expect(form.submitCount).toBe(0);
  });

  test('Individual fields are fully reset', () => {
    const initial = {
      name: 'John',
      age: 20,
      friends: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 20 },
      ],
    };

    const form = new KeckForm({
      initial,
      validate: () => ({}),
    });

    form.field('name').value = 'Changed';
    form.field('name').touched = true;

    form.field('friends.0.name').value = 'friends-0-changed';
    form.field('friends.0.name').touched = true;
    form.field('friends.1.name').value = 'friends-1-changed';
    form.field('friends.1.name').touched = true;

    expect(form.touched).toBe(true);
    expect(form.field('name').touched).toBe(true);
    expect(form.field('friends').touched).toBe(true);
    expect(form.field('friends.0').touched).toBe(true);
    expect(form.field('friends.0.name').touched).toBe(true);
    expect(form.field('friends.1.name').touched).toBe(true);

    form.handleSubmit();
    expect(form.submitCount).toBe(1);

    form.field('friends.0.name').reset();

    // expect friends.0.name to be reset (value, touched)
    expect(form.field('friends.0.name').value).toBe(initial.friends[0].name);
    expect(form.field('friends.0.name').touched).toBe(false);
    expect(form.field('friends.0').value).toEqual(initial.friends[0]);
    expect(form.field('friends.0').touched).toBe(false);

    // expect friends.1.name to remain changed
    expect(form.field('friends.1.name').value).toBe('friends-1-changed');
    expect(form.field('friends.1.name').touched).toBe(true);
    expect(form.field('friends.1').touched).toBe(true);

    // expect name to remain changed
    expect(form.field('name').value).toBe('Changed');
    expect(form.touched).toBe(true);
  });

  test('Root field reset restores all values and clears touched', () => {
    const initial = { name: 'John', age: 20 };
    const form = new KeckForm({ initial, validate: () => ({}) });

    form.field('name').value = 'Jane';
    form.field('age').value = 99;
    form.touched = true;

    form.field('').reset();

    expect(form.value).toEqual(initial);
    expect(form.touched).toBe(false);
  });

  test('Individual Set fields reset correctly when form is observed', () => {
    const observer = observe(
      new KeckForm({
        initial: {
          permissions: new Set(['role-default']),
        },
      }),
      { focusable: true, onChange: vi.fn() },
    );
    const { commit } = focus(observer);

    const firstSet = observer.field('permissions').value;
    commit();
    firstSet.add('user-override');
    expect([...observer.field('permissions').value]).toEqual(['role-default', 'user-override']);

    observer.field('permissions').reset();

    const resetSet = observer.field('permissions').value;
    // expect(resetSet).not.toBe(firstSet);
    // expect(unwrap(resetSet)).not.toBe(unwrap(firstSet));
    expect([...resetSet]).toEqual(['role-default']);

    resetSet.add('new-user-override');
    expect([...observer.field('permissions').value]).toEqual(['role-default', 'new-user-override']);
  });
});
