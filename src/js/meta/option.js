
export const defaultOption = {
	pattern: undefined,
	bg: undefined,
	border: "1",
	blackWhite: false,
	knightOffset: .6,
	SN: false,
	size: 44,
	w: 8,
	h: 8,
	set: "1echecs",
};

export const BORDER = /^\d+(,\d+)*$/;

const sizes = [26, 32, 38, 44];
const sets = ["1echecs", "alpha", "goodCompanion", "merida", "skak"];

export function makeOption(option) {
	const result = Object.assign({}, defaultOption);
	if(option) {
		const size = Number(option.size);
		const w = Math.floor(Number(option.w));
		const h = Math.floor(Number(option.h));
		if(sizes.includes(size)) result.size = size;
		if(sets.includes(option.set)) result.set = option.set;
		if(option.border && option.border.match(BORDER)) result.border = option.border;
		if(0 < option.knightOffset && option.knightOffset < 1) result.knightOffset = option.offset;
		result.blackWhite = Boolean(option.blackWhite);
		result.pattern = option.pattern;
		result.bg = option.bg;
		result.SN = option.SN;
		if(w > 0) result.w = w;
		if(h > 0) result.h = h;
	}
	return result;
}

export function parseBorder(border) {
	const array = border.split(",").map(n => {
		const result = Number(n);
		return isNaN(result) ? 0 : Math.abs(Math.floor(result));
	});
	const size = array.reduce((v, x) => v + x, 0);
	return { array, size };
}