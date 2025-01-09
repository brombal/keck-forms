/**
 * Recursively set all properties of source onto target if they are different
 */
function applyRecursive(target: any, source: any) {
  if (typeof target !== 'object' || typeof source !== 'object') return;
  if (target === null || source === null) return;

  for (const key in source) {
    if (
      target[key] &&
      source[key] &&
      Object.getPrototypeOf(target[key]) === Object.prototype &&
      Object.getPrototypeOf(source[key]) === Object.prototype
    ) {
      applyRecursive(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  for (const key in target) {
    if (!(key in source)) delete target[key];
  }
}
