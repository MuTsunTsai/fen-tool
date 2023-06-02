
export const defaultOption = {
	pattern: undefined,
	bg: undefined,
	blackWhite: false,
	knightOffset: .6,
	SN: false,
	size: 44,
	set: "1echecs",
};

const sizes = [26, 32, 38, 44];
const sets = ["1echecs", "alpha", "goodCompanion", "merida", "skak"];

export function makeOption(option) {
	const result = Object.assign({}, defaultOption);
	if(option) {
		const size = Number(option.size);
		if(sizes.includes(size)) result.size = size;
		if(sets.includes(option.set)) result.set = option.set;
		if(0 < option.knightOffset && option.knightOffset < 1) result.knightOffset = option.offset;
		result.blackWhite = Boolean(option.blackWhite);
		result.pattern = option.pattern;
		result.bg = option.bg;
		result.SN = option.SN;
	}
	return result;
}