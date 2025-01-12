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
    return null as any;
  }
}
