
export const defaultOption = {
	pattern: undefined,
	bg: undefined,
	exHigh: true,
	border: "1",
	blackWhite: false,
	knightOffset: .6,
	SN: false,
	size: 44,
	w: 8,
	h: 8,
	fullFEN: false,
	coordinates: false,
	set: "1echecs",
	collapse: true,
};

const BORDER = /^\d+(,\d+)*$/;

const sizes = [26, 32, 38, 44];
const sets = ["1echecs", "alpha", "goodCompanion", "merida", "skak"];

/**
 * @param {string} border 
 */
export function sanitizeBorder(border) {
	if(typeof border != "string") return null;
	// Allow nearly arbitrary input
	border = border.replace(/\D/g, ",")
		.replace(/,+/g, ",")
		.replace(/^,/, "")
		.replace(/,$/, "");
	if(!border.match(BORDER)) return null;
	return border;
}

export function makeOption(option) {
	const result = Object.assign({}, defaultOption);
	if(option) {
		const size = Number(option.size);
		if(sizes.includes(size)) result.size = size;

		if(sets.includes(option.set)) result.set = option.set;

		option.border = sanitizeBorder(option.border);
		if(option.border) result.border = option.border;

		if(0 < option.knightOffset && option.knightOffset < 1) {
			result.knightOffset = option.offset;
		}

		result.blackWhite = Boolean(option.blackWhite);
		result.pattern = option.pattern;
		result.bg = option.bg;
		result.SN = option.SN;

		const w = Math.floor(Number(option.w));
		const h = Math.floor(Number(option.h));
		if(w > 0) result.w = w;
		if(h > 0) result.h = h;
	}
	return result;
}

/**
 * @param {string} border 
 */
function parseBorder(border) {
	const array = border.split(",").map(n => {
		const result = Number(n);
		return isNaN(result) ? 0 : Math.abs(Math.floor(result));
	});
	const size = array.reduce((v, x) => v + x, 0);
	return { array, size };
}

export const LABEL_MARGIN = 20;

/**
 * @param {boolean|undefined} horTemplate 
 */
export function getDimensions(options, horTemplate) {
	const border = parseBorder(options.border);
	const margin = options.coordinates ? { x: LABEL_MARGIN, y: LABEL_MARGIN } : { x: 0, y: 0 };
	if(horTemplate === true) margin.y = 0;
	if(horTemplate === false) margin.x = 0;
	const w = options.w * options.size + 2 * border.size + margin.x;
	const h = options.h * options.size + 2 * border.size + margin.y;
	const offset = { x: border.size + margin.x, y: border.size };
	return { w, h, border, offset, margin };
}