import { derive } from 'keck';
import { KeckFieldBase, type KeckFieldForPath } from './KeckField';
import type { StringPath } from './types';

export class KeckFieldObject<
  TFormInput extends object,
  TStringPath extends StringPath<TFormInput>,
> extends KeckFieldBase<TFormInput, TStringPath> {
  field<TPath extends string>(
    _path: TPath,
  ): `${TStringPath}.${TPath}` extends StringPath<TFormInput>
    ? KeckFieldForPath<
        TFormInput,
        `${TStringPath}.${TPath}` extends StringPath<TFormInput> ? `${TStringPath}.${TPath}` : never
      >
    : never {
    return this.form.field(`${this.path}.${_path}` as any) as any;
  }

  get allErrors(): Array<{ path: string; errors: string[] }> {
    return derive(
      () => {
        const entries = Object.entries(this.formState.errors).filter(([key]) =>
          key.startsWith(this.path),
        );
        return entries.map(([path, errors]) => ({ path, errors }));
      },
      (a, b) => JSON.stringify(a) === JSON.stringify(b),
    );
  }
}
