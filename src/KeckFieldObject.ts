import { derive, shallowCompare } from 'keck';
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

  get errors(): string[] {
    return derive(() => {
      return Object.entries(this.formState.errors)
        .filter(([key]) => key.startsWith(this.path))
        .flatMap(([, value]) => value);
    }, shallowCompare);
  }
}
