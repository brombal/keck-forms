import { get as _get } from 'lodash-es';

export function get(obj: any, path: string | null | undefined): unknown {
  return !path ? obj : _get(obj, path);
}
