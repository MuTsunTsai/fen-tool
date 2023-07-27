import { INIT_FORSYTH, makeForsyth, parseSquare, parseFEN } from "../fen.mjs";
import { createAbbrExp, createAbbrReg } from "../regex.mjs";
import { SQ, P, Twin, Step, toNormalPiece } from "./base.mjs";
import { processStep } from "./step.mjs";
import { makeTwin } from "./twin.mjs";

const TWIN = new RegExp(Twin);

export function formatSolution(input, initFEN, output) {
	return parseSolution(input, initFEN, output, makeStep);
}

export function parseSolution(input, initFEN, output, factory) {
	if(!initFEN) return output;
	console.log(output);

	const { duplex, halfDuplex, initImitators } = parseInput(input);

	let stipIndex = 0;
	const stipulations = getStipulations(input);
	const ordering = inferMoveOrdering(stipulations[0], halfDuplex);
	const isPG = (/dia/i).test(stipulations[0]);
	const init = addImitator(isPG ? INIT_FORSYTH : toNormalFEN(initFEN), initImitators);
	const state = {
		init,
		initImitators,
		currentOrdering: ordering,
		stack: [],
		board: parseFEN(init),
		imitators: initImitators?.concat(),
	};
	let lastPosition = init;
	let lastOrdering = ordering;
	let error = false;

	let hasTwin = false;
	output = output
		.replace(/<br>/g, "\n")
		.replace(/a\) \n/, () => {
			hasTwin = true;
			return `${factory("a)", init)}\n`;
		});
	if(!hasTwin) output = output.replace(/^(Popeye.+?)$/m, `$1 ${factory("Beginning", init)}`);

	const duplexSeparator = duplex ? getDuplexSeparator(output) : "";
	const duplexSeparatorReg = duplexSeparator ? duplexSeparator.replace(/\n/g, "\\n") + "|" : "";
	const TOKEN = new RegExp(duplexSeparatorReg + `(?:${Twin})|(?:${Step})`, "g");

	// Main replacement
	let solutionPrinted = false;
	output = output.replace(TOKEN, text => {
		// console.log(text);
		if(error) return text;
		try {
			if(text == duplexSeparator) {
				if(solutionPrinted) {
					state.currentOrdering = flipOrdering(state.currentOrdering);
				}
				return text;
			}

			// Enter twin
			const twin = text.match(TWIN);
			if(twin) {
				solutionPrinted = false;
				const cont = Boolean(twin[1]);
				const stip = stipulations[++stipIndex];
				state.currentOrdering = lastOrdering =
					stip ? inferMoveOrdering(stip, halfDuplex) : // infer from stip first
					cont ? lastOrdering : // then use the last one if it's continued
					ordering; // otherwise reset
				state.stack.length = 0;
				state.board = parseFEN(cont ? lastPosition : init);
				makeTwin(state.board, twin[2]);
				const fen = makeForsyth(state.board);
				lastPosition = fen;
				return factory(text, fen);
			}

			solutionPrinted = true;
			return processStep(text, state, factory);
		} catch(e) {
			// Something is not right. Give up.
			console.log(e, text);
			error = true;
			return text;
		}
	});
	return output.replace(/\n/g, "<br>");
}

const STIP = new RegExp(String.raw`${createAbbrExp("stipulation")}\s+(\S*(?:\d|[^\d\s]\s+\d+(?:\.[05])?))`, "i");

/**
 * @param {string} input 
 */
export function getStipulations(input) {
	return input.split(/\btwin\b/i).map(sec => sec.match(STIP)?.[1].replace(/\s/g, ""));
}

/** Try to guess the WB/BW move ordering; this is needed only for castling. */
export function inferMoveOrdering(stip, halfDuplex) {
	// It is assumed there that spaces are removed in stip
	const m = stip.match(/^(\d+-&gt;)?(?:exact-)?(?:(?:ser|pser|phser|semi|reci)-)?(hs|hr|h|s|r)?/i);
	let result;
	if(!m || m[1]) result = "wb";
	else result = m[2] == "h" ? "bw" : "wb";
	return halfDuplex ? flipOrdering(result) : result;
}

function addImitator(fen, imitators) {
	if(!imitators) return fen;
	const board = parseFEN(fen);
	for(const sq of imitators) {
		board[parseSquare(sq)] = "-c";
	}
	return makeForsyth(board);
}

const IMITATOR = new RegExp(String.raw`\bimit\w*\s+(?:${SQ})+`, "ig");

const Commands = ["condition", "option", "stipulation", "sstipulation", "forsyth", "pieces", "twin"];
const COMMANDS = new RegExp(Commands.map(createAbbrExp).join("|"), "ig");
const DUPLEX = createAbbrReg("duplex");
const HALF_DUPLEX = createAbbrReg("halfDuplex");

function parseInput(input) {
	input = input
		.replace(/\n/g, " ")
		.replace(COMMANDS, "\n$&")
		.split("\n");
	const options = input.filter(c => c.match(/^opti/i)).join(" ");
	const conditions = input.filter(c => c.match(/^cond/i)).join(" ");
	return {
		initImitators: conditions.match(IMITATOR)?.join(" ").match(new RegExp(SQ, "g")),
		duplex: DUPLEX.test(options),
		halfDuplex: HALF_DUPLEX.test(options),
	};
}

function flipOrdering(order) {
	return order == "wb" ? "bw" : "wb"
}

function getDuplexSeparator(output) {
	// The idea is to find the maximal gap between solutions.
	const reg = /^\n\n+ +1\./;
	const counts = output
		.replace(/\n\nsolution finished./, "\n  1.") // in case there's no solution for duplex
		.match(/\n\n+[^\n]+/g)
		.filter((e, i, a) => i > 0 && e.match(reg) && a[i - 1].match(reg))
		.map(h => h.match(/^\n+/)[0].length);
	return "\n".repeat(Math.max(...counts));
}

function makeStep(text, fen) {
	return `<span class="step btn btn-secondary px-1 py-0" data-fen="${fen}">${text}</span>`
}

const FEN_TOKEN = new RegExp(String.raw`/|\d+|[+-=]?${P}`, "ig");

export function toNormalFEN(fen) {
	const arr = fen.match(FEN_TOKEN);
	return arr.map(t => {
		if(t == "/" || t.match(/^\d+$/)) return t;
		if(t.startsWith("+")) t = t.substring(1).toUpperCase();
		if(t.startsWith("-")) t = t.substring(1).toLowerCase();
		if(t.startsWith("=")) t = "-" + t.substring(1).toLowerCase();
		return toNormalPiece(t);
	}).join("");
}
