import { clone } from "../clone.mjs";
import { INIT_FORSYTH, makeForsyth, parseSquare, parseFEN } from "../fen.mjs";
import { createAbbrExp, createAbbrReg } from "../regex.mjs";
import { SQ, Twin, Step, toNormalPiece } from "./base.mjs";
import { processStep } from "./step.mjs";
import { makeTwin } from "./twin.mjs";

const TWIN = new RegExp(Twin);
const TOKEN = new RegExp(String.raw`\n\n+|(?:${Twin})|(?:${Step})`, "g");

export function formatSolution(input, initFEN, output) {
	return parseSolution(input, initFEN, output, makeStep);
}

export function parseSolution(input, initFEN, output, factory) {
	if(!initFEN) return output;
	console.log(output);

	const options = parseInput(input);
	let stipIndex = 0;
	const stipulations = getStipulations(input);
	const initProblem = {
		pg: (/dia/i).test(stipulations[0]),
		fen: addImitator(toNormalFEN(initFEN), options.imitators),
		imitators: options.imitators,
		ordering: inferMoveOrdering(stipulations[0], options.halfDuplex),
	};
	let currentProblem = initProblem;

	const init = currentProblem.pg ? INIT_FORSYTH : currentProblem.fen;
	const state = {
		stack: [],
		board: parseFEN(init),
		ordering: currentProblem.ordering,
		imitators: currentProblem.imitators?.concat(),
	};
	let error = false;

	output = output.replace(/<br>/g, "\n");

	const duplexSeparator = options.duplex ? getDuplexSeparator(output) : "";

	// Main replacement
	let solutionPrinted = false;
	output = output.replace(TOKEN, text => {
		if(error) return text;
		try {
			if(text.match(/^\n+$/)) {
				// Reset stack
				state.stack.length = 0;
				const initPosition = currentProblem.pg ? INIT_FORSYTH : currentProblem.fen;
				state.board = parseFEN(initPosition);

				// 
				if(text == duplexSeparator && solutionPrinted) {
					state.ordering = flipOrdering(state.ordering);
				}
				return text;
			}

			// Enter twin
			const twin = text.match(TWIN);
			if(twin) {
				solutionPrinted = false;
				currentProblem = clone(twin[1] ? currentProblem : initProblem);
				const stip = stipulations[++stipIndex];
				if(stip) {
					currentProblem.ordering = inferMoveOrdering(stip, options.halfDuplex);
					currentProblem.pg = (/dia/i).test(stip);
				}
				state.ordering = currentProblem.ordering;
				state.stack.length = 0;

				const { fen, board } = makeTwin(currentProblem.fen, twin[2]);
				currentProblem.fen = fen;
				state.board = currentProblem.pg ? parseFEN(INIT_FORSYTH) : board;
				return text;
			}

			solutionPrinted = true;
			return processStep(text, currentProblem, state, factory);
		} catch(e) {
			// Something is not right. Give up.
			console.log(e, text);
			error = true;
			return text;
		}
	});
	return output.replace(/   <span init/g, "<span").replace(/\n/g, "<br>");
}

const STIP = new RegExp(String.raw`${createAbbrExp("stipulation")}\s+(\S*(?:\d|[^\d\s]\s+\d+(?:\.[05])?))`, "i");

/**
 * @param {string} input 
 */
export function getStipulations(input) {
	return input.split(/\btwin\b/i).map(sec => sec.match(STIP)?.[1].replace(/\s/g, ""));
}

/**
 * Try to guess the WB/BW move ordering; this is needed only for castling.
 * @param {string} stip 
 * @param {boolean} halfDuplex 
 */
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
		board[parseSquare(sq)] = "-" + toNormalPiece("i");
	}
	return makeForsyth(board);
}

const IMITATOR = new RegExp(String.raw`\bimit\w*\s+(?:${SQ})+`, "ig");

const Commands = ["condition", "option", "stipulation", "sstipulation", "forsyth", "pieces", "twin"];
const COMMANDS = new RegExp(Commands.map(createAbbrExp).join("|"), "ig");
const DUPLEX = createAbbrReg("duplex");
const HALF_DUPLEX = createAbbrReg("halfDuplex");

/**
 * @param {string} input 
 */
function parseInput(input) {
	const commands = input
		.replace(/\n/g, " ")
		.replace(COMMANDS, "\n$&")
		.split("\n");
	const options = commands.filter(c => c.match(/^opti/i)).join(" ");
	const conditions = commands.filter(c => c.match(/^cond/i)).join(" ");
	return {
		imitators: conditions.match(IMITATOR)?.join(" ").match(new RegExp(SQ, "g")),
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
	const init = text == "*" ? "init " : "";
	fen = fen
		.replace(/-/g, "&#45;") 	// To prevent being processed again
		.replace(/"/g, "&#34;");	// Just to be safe
	return `<span ${init}class="step btn btn-secondary px-1 py-0" data-fen="${fen}">${text}</span>`
}

const FEN_TOKEN = /[-+=]?(\.[0-9A-Z][0-9A-Z]|[A-Z])|\d+|\//ig;

export function toNormalFEN(fen) {
	const arr = fen.match(FEN_TOKEN);
	return arr.map(t => {
		if(t == "/" || t.match(/^\d+$/)) return t;
		const prefix = t.match(/^[-+=]/) ? t[0] : null;
		if(prefix) t = t.substring(1);
		if(t.startsWith(".")) t = t.substring(1);
		t = toNormalPiece(t);
		if(prefix == "+") t = t.toUpperCase();
		if(prefix == "-") t = t.toLowerCase();
		if(prefix == "=") t = "-" + t.toLowerCase();
		return t;
	}).join("");
}
