import { get as _get } from 'lodash-es';

export function get(obj: any, path: string | string[] | null | undefined): unknown {
  return !path?.length ? obj : _get(obj, path);
}
