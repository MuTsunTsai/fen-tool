/**
 * @param {string} text 
 */
export function createAbbrReg(text, length = 4) {
	return new RegExp(createAbbrExp(text, length), "i");
}

/**
 * Create a fragment of a regular expression to match a given word,
 * while allowing just the first few characters (at least 4 by default).
 * For example, if `remark` is given, all `rema`, `remar` and `remark`
 * will match, but not `remat`.
 * @param {string} text
 */
export function createAbbrExp(text, length = 4) {
	if(text.length <= length) return "\\b" + text + "\\b";
	return "\\b" + text.substring(0, 4) + createAbbrExpRecursive(text.substring(4));
}

/**
 * @param {string} text 
 */
function createAbbrExpRecursive(text) {
	if(text == "") return "";
	return String.raw`(?:${text[0]}${createAbbrExpRecursive(text.substring(1))}|\b)`;
}