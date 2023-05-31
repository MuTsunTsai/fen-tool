
const VALUE = /^[-~]?(\*\d)?([kqbsnrpcx]|'[^']|''..)$/iu;
const FEN_UNIT = /\/|\d|[-~]?(\*\d)?([kqbsnrpcx]|'[^']|''..)|./iug;

/**
 * Parse FEN syntax.
 * @returns An array of values for each of 64 squares.
 */
export function parseFEN(fen) {
	const values = fen.match(FEN_UNIT) || [];
	const result = [];
	let ignoreNextSlash = false;
	for(const value of values) {
		if(value == "/") {
			if(!ignoreNextSlash) {
				const target = result.length + 8 - result.length % 8;
				while(result.length < target) result.push("");
			}
		} else if(value.match(/^\d$/)) {
			const n = Number(value);
			for(let i = 0; i < n; i++) result.push("");
		} else {
			result.push(value);
		}
		ignoreNextSlash = value != "/" && result.length % 8 == 0;
	}
	while(result.length < 64) result.push("");
	return result;
}

/**
 * Make FFEN from an array of values.
 */
export function makeFEN(values) {
	let aggregateSpaces = 0, result = "";
	function flush() {
		if(aggregateSpaces) result += aggregateSpaces;
		aggregateSpaces = 0;
	}
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const index = i * 8 + j;
			if(values[index] == "") {
				aggregateSpaces++;
			} else {
				flush();
				result += values[index];
			}
		}
		flush();
		if(i < 7) result += "/";
	}
	return result;
}

export function normalize(v, useSN) {
	// Text input shortcut
	if(!v.match(VALUE)) {
		const l = [...v].length;
		if(l == 1 && v != "'") v = "'" + v;
		else if(l == 2) v = "''" + v;
		else v = "";
	}

	v = v.replace(/^~/, "-") // both "-" and "~" are acceptable syntax
		.replace(/^-(?=.*')/, ""); // neutral has no effect on text

	// Neutral
	if(v.startsWith("-")) v = v.toLowerCase();
	
	// SN conversion
	if(v.match(/^-?(\*\d)?[sn]$/i)) {
		if(useSN) v = v.replace("n", "s").replace("N", "S");
		else v = v.replace("s", "n").replace("S", "N");
	}

	return v;
}