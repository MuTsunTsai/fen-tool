import { BOARD_SIZE } from "./constants";

import type { Background } from "./enum";

export const DEFAULT_SIZE = 44;
export const DEFAULT_SET = "1echecs";

export const DEFAULT_BOARD_OPTIONS = {
	pattern: undefined as string | undefined,
	bg: undefined as Background | undefined,
	exHigh: true,
	border: "1",
	blackWhite: false,
	knightOffset: 0.6,
	SN: false,
	size: DEFAULT_SIZE,
	w: BOARD_SIZE,
	h: BOARD_SIZE,
	fullFEN: false,
	coordinates: false,
	set: DEFAULT_SET,
	collapse: true,
};

export type BoardOptions = typeof DEFAULT_BOARD_OPTIONS;

const BORDER = /^\d+(,\d+)*$/;

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const sizes = [26, 32, 38, 44];
const sets = ["1echecs", "alpha", "goodCompanion", "kilfiger", "merida", "mpchess", "skak"];

export function sanitizeBorder(border?: string): string | undefined {
	if(typeof border != "string") return undefined;
	// Allow nearly arbitrary input
	border = border.replace(/\D/g, ",")
		.replace(/,+/g, ",")
		.replace(/^,/, "")
		.replace(/,$/, "");
	if(!border.match(BORDER)) return undefined;
	return border;
}

export function makeOption(option: Partial<BoardOptions>): BoardOptions {
	const result = Object.assign({}, DEFAULT_BOARD_OPTIONS);
	if(option) {
		const size = Number(option.size);
		if(sizes.includes(size)) result.size = size;

		if(option.set && sets.includes(option.set)) result.set = option.set;

		option.border = sanitizeBorder(option.border);
		if(option.border) result.border = option.border;

		if(option.knightOffset && 0 < option.knightOffset && option.knightOffset < 1) {
			result.knightOffset = option.knightOffset;
		}

		result.blackWhite = Boolean(option.blackWhite);
		result.pattern = option.pattern;
		result.bg = option.bg;
		result.SN = option.SN || false;

		const w = Math.floor(Number(option.w));
		const h = Math.floor(Number(option.h));
		if(w > 0) result.w = w;
		if(h > 0) result.h = h;
	}
	return result;
}

function parseBorder(border: string): Border {
	const array = border.split(",").map(n => {
		const result = Number(n);
		return isNaN(result) ? 0 : Math.abs(Math.floor(result));
	});
	const size = array.reduce((v, x) => v + x, 0);
	return { array, size };
}

export const LABEL_MARGIN = 20;

export interface Border {
	array: number[];
	size: number;
}

export interface DimensionInfo extends Dimension {
	border: Border;
	offset: IPoint;
	margin: IPoint;
}

export function getDimensions(options: BoardOptions, horTemplate?: boolean): DimensionInfo {
	const border = parseBorder(options.border);
	const margin = options.coordinates ? { x: LABEL_MARGIN, y: LABEL_MARGIN } : { x: 0, y: 0 };
	if(horTemplate === true) margin.y = 0;
	if(horTemplate === false) margin.x = 0;
	const w = options.w * options.size + 2 * border.size + margin.x;
	const h = options.h * options.size + 2 * border.size + margin.y;
	const offset = { x: border.size + margin.x, y: border.size };
	return { w, h, border, offset, margin };
}
