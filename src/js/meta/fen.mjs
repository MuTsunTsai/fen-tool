
export const DEFAULT = "8/8/8/8/8/8/8/8";
export const INIT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

const EMOJI = `[🇦-🇿]{2}|\\p{ExtPict}\\uFE0F?\\p{EMod}?(\\u200D\\p{ExtPict}\\uFE0F?\\p{EMod}?)*`;
const YACPDB = `\\((!?)([kqbnrp])(\\d?)\\)`; // also captures 3 parts
const TYPES = `[kqbnrpcxstadg]`;
const TEXT = `'(${EMOJI}|[^'])|''..`;
const FFEN = `[-~]?(\\*\\d)?(${TYPES}|${TEXT})`;

export const ONE_EMOJI = RegExp(`^(?:${EMOJI})$`, "u");
const VALUE = RegExp(`^(?:${YACPDB}|${FFEN})$`, "iu");
const FEN_UNIT = RegExp(`\\/|\\d+|${YACPDB}|${FFEN}|.`, "iug");

export function inferDimension(fen) {
	const values = fen.match(FEN_UNIT) || [];
	const rows = [0];
	let cursor = 0;
	for(const value of values) {
		if(value == "/") rows[++cursor] = 0;
		else if(value.match(/^\d+$/)) rows[cursor] += Number(value);
		else rows[cursor]++;
	}
	const h = rows.length;
	if(h == 1) return undefined; // There's no "/", we cannot be certain
	const w = rows[0];
	for(const v of rows) if(v != w) return undefined;
	return { w, h };
}

/**
 * Parse FEN syntax.
 * @returns An array of values for each squares.
 */
export function parseFEN(fen, w = 8, h = 8) {
	const values = fen.match(FEN_UNIT) || [];
	const result = [];
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
 * Make FFEN from an array of values.
 */
export function makeFEN(values, w = 8, h = 8) {
	let aggregateSpaces = 0, result = "";
	function flush() {
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

export function normalize(v, useSN, convert) {
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

export function toYACPDB(value) {
	value = convertSN(value, false, true);
	const match = value.match(/^(-?)(?:\*(\d))?([kqbnrp])$/i);
	if(!match) return "";
	if(!match[1] && !match[2]) return match[3];
	return "(" + (match[1] ? "!" : "") + match[3] + (match[2] || "") + ")";
}

export function convertSN(value, useSN, convert) {
	if(!value.match(/^-?(\*\d)?[sng]$/i)) return value;
	if(useSN) {
		if(convert) value = value.replace("s", "g").replace("S", "G");
		value = value.replace("n", "s").replace("N", "S");
	} else {
		if(convert) value = value.replace("s", "n").replace("S", "N")
		value = value.replace("g", "s").replace("G", "S");
	}
	return value;
}

/**
 * Convert to board coordinate notation (only orthodox board is supported).
 */
export function toSquare(i, j) {
	if(j === undefined) {
		j = i % 8;
		i = i >>> 3;
	}
	return String.fromCharCode(97 + j) + (8 - i);
}

export function parseSquare(sq) {
	return (8 - Number(sq[1])) * 8 + (sq.charCodeAt(0) - 97)
}