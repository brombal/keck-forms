import { KeckFieldBase } from 'keck-forms/KeckField';
import type { KeckFieldForPath, StringPath } from 'keck-forms/types';

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
    return null as any;
  }
}
