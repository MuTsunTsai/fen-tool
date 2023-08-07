/**
 * @param {string} text 
 */
export function createAbbrReg(text, prefix = "", suffix = "") {
	return new RegExp(prefix + createAbbrExp(text) + suffix, "i");
}

/**
 * Create a fragment of a regular expression to match a given word,
 * while allowing just the first few characters (at least 4 by default).
 * For example, if `remark` is given, all `rema`, `remar` and `remark`
 * will match, but not `remat`.
 * @param {string} text
 */
export function createAbbrExp(text) {
	let length = 4;
	if(text.match(/^\d/)) {
		length = Number(text[0]);
		text = text.substring(1);
	}
	if(text.length <= length) return "\\b" + text + "\\b";
	return "\\b" + text.substring(0, length) + createAbbrExpRecursive(text.substring(length));
}

/**
 * @param {string} text 
 */
function createAbbrExpRecursive(text) {
	if(text == "") return "";
	return String.raw`(?:${text[0]}${createAbbrExpRecursive(text.substring(1))}|\b)`;
}