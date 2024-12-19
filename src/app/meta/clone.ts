
/**
 * Deeply clone the nested contents of an object.
 * Objects on all depths will be cloned, not referred.
 */
export function deepAssign<T>(target: T, source: T, skipPropertiesNotInTarget = false): T {
	if(!(source instanceof Object)) return target;

	// This also applies to the case where s is an array.
	// In that case, the keys will automatically be the indices of the array.
	const keys = Object.keys(source) as (keyof T)[];

	for(const k of keys) {
		if(skipPropertiesNotInTarget && target instanceof Object && !(k in target)) continue;
		const v = source[k];
		if(!(v instanceof Object)) {
			target[k] = v; // primitive values can be copied directly
		} else if(target[k] instanceof Object && target[k] != v) { // Make sure that reference is different
			target[k] = deepAssign(target[k], v, skipPropertiesNotInTarget);
		} else {
			target[k] = clonePolyfill(v);
		}
	}
	return target;
}

/**
 * Clone an object.
 */
function clonePolyfill<T extends object>(source: T): T {
	// `isArray` is more reliable than `instanceof Array`,
	// See https://stackoverflow.com/a/22289869/9953396
	const target = (Array.isArray(source) ? [] : {}) as T;
	return deepAssign(target, source);
}

/**
 * Use native {@link structuredClone} whenever possible
 * (see [CanIUse](https://caniuse.com/?search=structuredClone)),
 * otherwise fallback to polyfill.
 */
export const clone: typeof clonePolyfill = typeof structuredClone === "function" ? structuredClone : clonePolyfill;
