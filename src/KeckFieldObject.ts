import { derive } from 'keck';
import { KeckFieldBase, type KeckFieldForPath } from './KeckField';
import { $errors } from './KeckForm.internalFields';
import type { StringPaths } from './types';

export class KeckFieldObject<
  TFormInput extends object,
  TStringPath extends string,
> extends KeckFieldBase<TFormInput, TStringPath> {
  field<TPath extends string>(
    _path: TPath,
  ): `${TStringPath}.${TPath}` extends StringPaths<TFormInput>
    ? KeckFieldForPath<
        TFormInput,
        `${TStringPath}.${TPath}` extends StringPaths<TFormInput>
          ? `${TStringPath}.${TPath}`
          : never
      >
    : never {
    return this.form.field(`${this.path}.${_path}` as any) as any;
  }

  get allErrors(): Array<{ path: string; errors: string[] }> {
    return derive(
      () => {
        const entries = Object.entries(this.form[$errors]).filter(([key]) =>
          key.startsWith(this.path),
        );
        return entries.map(([path, errors]) => ({ path, errors }));
      },
      (a, b) => JSON.stringify(a) === JSON.stringify(b),
    );
  }
}
