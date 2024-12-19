import { CHAR_A_OFFSET, BOARD_SIZE } from "./constants";

import type { Direction } from "./enum";

export const DEFAULT = "8/8/8/8/8/8/8/8";
export const INIT_FORSYTH = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

// Safari < 14 does not support shorthands such as "ExtPict" and "EMod"
const RI = `\\p{Regional_Indicator}`, ExtPict = `\\p{Extended_Pictographic}`, EMod = `\\p{Emoji_Modifier}`;
const EMOJI = `${RI}{2}|${ExtPict}\\uFE0F?${EMod}?(\\u200D${ExtPict}\\uFE0F?${EMod}?)*`;

const YACPDB = `\\((!?)([kqbnrp])(\\d?)\\)`; // also captures 3 parts
const TYPES = `[kqbnrpcxstadg]`;
const TEXT = `'(${EMOJI}|[^'])|''..`;
const FFEN = `[-~]?(\\*\\d)?(${TYPES}|${TEXT})`;

export const ONE_EMOJI = RegExp(`^(?:${EMOJI})$`, "u");
const VALUE = RegExp(`^(?:${YACPDB}|${FFEN})$`, "iu");
const FEN_TOKEN = RegExp(`\\/|\\d+|${YACPDB}|${FFEN}|.`, "iug");

/**
 * There are two possible representation systems for blank squares concerning larger boards.
 * The "normal system" used by FFEN and internally by FEN Tool,
 * is to treat consecutive digits as a single token.
 * The other "single digit" system, on the other hand, treat each digit separately,
 * so 10 consecutive blank squares will have to represent as "91" or something equivalent.
 * This functions normalizes the latter into the former.
 */
export function normalizeSpaceRepresentation(fen: string): string {
	const tokens = fen.match(FEN_TOKEN) || [];
	if(!tokens.some(token => token.match(/^\d\d+$/))) return fen;
	const rows = [0];
	let cursor = 0;
	for(let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if(token == "/") {
			rows[++cursor] = 0;
		} else if(token.match(/^\d+$/)) {
			if(token.length == 1) {
				rows[cursor] += Number(token);
			} else {
				const value = token.split("").map(n => Number(n)).reduce((v, x) => v + x, 0);
				rows[cursor] += value;
				tokens[i] = value.toString();
			}
		} else {
			rows[cursor]++;
		}
	}
	if(allEqual(rows)) return tokens.join("");
	return fen;
}

export function inferDimension(fen: string): Dimension | undefined {
	const tokens = fen.match(FEN_TOKEN) || [];
	const rows = [0];
	let cursor = 0;
	for(const token of tokens) {
		if(token == "/") rows[++cursor] = 0;
		else if(token.match(/^\d+$/)) rows[cursor] += Number(token);
		else rows[cursor]++;
	}
	const h = rows.length;
	if(h == 1) return undefined; // There's no "/", we cannot be certain
	if(!allEqual(rows)) return undefined;
	return { w: rows[0], h };
}

function allEqual(numbers: number[]): boolean {
	const first = numbers[0];
	for(let i = 1; i < numbers.length; i++) {
		if(numbers[i] != first) return false;
	}
	return true;
}

/**
 * Parse FEN syntax.
 * @returns An array of values for each squares.
 */
export function parseFEN(fen: string, w = BOARD_SIZE, h = BOARD_SIZE): string[] {
	const values = fen.match(FEN_TOKEN) || [];
	const result: string[] = [];
	let ignoreNextSlash = false;
	for(const value of values) {
		if(value == "/") {
			if(!ignoreNextSlash) {
				const target = result.length + w - result.length % w;
				while(result.length < target) result.push("");
			}
		} else if(value.match(/^\d+$/)) {
			const n = Number(value);
			for(let i = 0; i < n; i++) result.push("");
		} else {
			result.push(value);
		}
		ignoreNextSlash = value != "/" && result.length % w == 0;
		if(result.length == w * h) break;
	}
	while(result.length < w * h) result.push("");
	return result;
}

/**
 * Make Forsyth notation from an array of values.
 */
export function makeForsyth(values: string[], w = BOARD_SIZE, h = BOARD_SIZE): string {
	let aggregateSpaces = 0, result = "";
	function flush(): void {
		if(aggregateSpaces) result += aggregateSpaces;
		aggregateSpaces = 0;
	}
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			const index = i * w + j;
			if(values[index] == "") {
				aggregateSpaces++;
			} else {
				flush();
				result += values[index];
			}
		}
		flush();
		if(i < h - 1) result += "/";
	}
	return result;
}

export function normalize(v: string, useSN: boolean, convert?: boolean): string {
	// Text input shortcut
	if(!v.match(VALUE)) {
		if(v.match(ONE_EMOJI)) {
			v = "'" + v; // A single emoji
		} else {
			const l = [...v].length;
			if(l == 1 && v != "'") v = "'" + v;
			else if(l == 2) v = "''" + v;
			else v = "";
		}
	}

	// YACPDB
	v = v.replace(RegExp(`^${YACPDB}$`, "i"), (_, $1, $2, $3) => {
		let result = $2;
		if($3) result = "*" + $3 + result;
		if($1) result = "-" + result;
		return result;
	});

	v = v.replace(/^~/, "-") // both "-" and "~" are acceptable syntax
		.replace(/^-(?=.*')/, ""); // neutral has no effect on text

	// Neutral
	if(v.startsWith("-")) v = v.toLowerCase();

	v = convertSN(v, useSN, convert);

	return v;
}

export function toYACPDB(value: string): string {
	value = convertSN(value, false, true);
	const match = value.match(/^(-?)(?:\*(\d))?([kqbnrp])$/i);
	if(!match) return "";
	const v = convertSN(match[3], true); // YACPDB use S for knight
	if(!match[1] && !match[2]) return v;
	return "(" + (match[1] ? "!" : "") + v + (match[2] || "") + ")";
}

export function convertSN(value: string, useSN?: boolean, convert?: boolean): string {
	if(!value.match(/^-?(\*\d)?[sng]$/i)) return value;
	if(useSN) {
		if(convert) value = value.replace("s", "g").replace("S", "G");
		value = value.replace("n", "s").replace("N", "S");
	} else {
		if(convert) value = value.replace("s", "n").replace("S", "N");
		value = value.replace("g", "s").replace("G", "S");
	}
	return value;
}

/**
 * Convert to board coordinate notation (only orthodox board is supported).
 */
export function toSquare(index: number): string;
export function toSquare(i: number, j: number, h?: number): string;
export function toSquare(i: number, j?: number, h = BOARD_SIZE): string {
	if(j === undefined) {
		j = i % BOARD_SIZE;
		i = (i - j) / BOARD_SIZE;
	}
	return String.fromCharCode(CHAR_A_OFFSET + j) + (h - i);
}

export function parseXY(sq: string, h = BOARD_SIZE): IPoint {
	return { x: sq.charCodeAt(0) - CHAR_A_OFFSET, y: h - Number(sq[1]) };
}

export function parseSquare(sq: string, w = BOARD_SIZE, h = BOARD_SIZE): number {
	const { x, y } = parseXY(sq, h);
	return y * w + x;
}

export function emptyBoard(n: number): Board {
	return Array.from({ length: n }, _ => "");
}

export function shift(array: string[], dx: number, dy: number, w = BOARD_SIZE, h = BOARD_SIZE): Board {
	const result = emptyBoard(w * h);
	result.anime = "";
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			const x = j + dx, y = i + dy;
			const inBoard = 0 <= x && x < w && 0 <= y && y < h;
			if(!array[i * w + j]) continue;
			result[y * w + x] = inBoard ? array[i * w + j] : "";
			result.anime += toSquare(i, j, h) + toSquare(y, x, h);
		}
	}
	return result;
}

export function mirror(array: string[], d: string, w = BOARD_SIZE, h = BOARD_SIZE): Board {
	const result = emptyBoard(w * h);
	result.anime = "";
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			let x = j, y = i;
			if(d == "-") x = w - 1 - x;
			if(d == "|" || d == "/") y = h - 1 - y;
			if(d == "/" || d == "\\") {
				const diff = y - x;
				x += diff;
				y -= diff;
			}
			if(d == "/") y = h - 1 - y;
			if(!array[y * w + x]) continue;
			result[i * w + j] = array[y * w + x];
			result.anime += toSquare(y, x, h) + toSquare(i, j, h);
		}
	}
	return result;
}

/**
 * Rotate an array and return the new array.
 */
export function rotate(array: string[], d: Direction, w = BOARD_SIZE, h = BOARD_SIZE): Board {
	const result = emptyBoard(w * h);
	if(w == h) result.anime = "";
	for(let i = 0; i < w; i++) {
		for(let j = 0; j < h; j++) {
			const { x, y } = getRotatedCoordinates(i, j, w, h, d);
			if(!array[y * w + x]) continue;
			result[i * h + j] = array[y * w + x];
			if(w == h) result.anime += toSquare(y, x, h) + toSquare(i, j, h);
		}
	}
	return result;
}

function getRotatedCoordinates(i: number, j: number, w: number, h: number, d: number): IPoint {
	if(d == 1) return { x: i, y: h - 1 - j };
	if(d == 2) return { x: h - 1 - j, y: w - 1 - i };
	return { x: w - 1 - i, y: j };
}

/**
 * Switch the upper/lower cases.
 * @param switchText Whether to also switch texts.
 */
export function invert(array: string[], switchText?: boolean): string[] {
	return array.map(s => {
		if(s == "" || s.startsWith("-")) return s;
		if(!switchText && s.startsWith("'")) return s;
		const t = s.toLowerCase();
		if(s == t) s = s.toUpperCase();
		else s = t;
		return s;
	});
}
