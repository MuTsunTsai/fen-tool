import { clone } from "../clone";
import { INIT_FORSYTH, makeForsyth, parseSquare, parseFEN } from "../fen";
import { createAbbrExp, createAbbrReg } from "../regex";
import { SQ, Twin, Step, toNormalPiece, COMMANDS } from "./base";
import { getInitPosition, processStep } from "./step";
import { makeTwin } from "./twin";

import type { Entry, Ordering, ParseContext, PopeyeOptions } from "./types";

const TWIN = new RegExp(Twin);
const TOKEN = new RegExp(String.raw`\n\n+|(?:${Twin})|(?:${Step})`, "g");

export type MakeStepFactory = typeof makeStep;

export function formatSolution(input: string, initFEN: string, output: string): string {
	return parseSolution(input, initFEN, output, makeStep);
}

export function parseSolution(input: string, initFEN: string, output: string, factory: MakeStepFactory): string {
	if(!initFEN) return output;
	console.log(output);
	output = output.replace(/<br>/g, "\n");
	const context = createParseContext(input, initFEN, output);

	// Main replacement
	let error = false;
	output = output.replace(TOKEN, text => {
		if(error) return text;
		try {
			if(parseReset(context, text) || parseTwin(context, text)) return text;
			context.state.solutionPrinted = true;
			return processStep(text, context.state, factory);
		} catch(e) {
			// Something is not right. Give up.
			console.log(e, text);
			error = true;
			return text;
		}
	});
	return output.replace(/ {2} ?<span init/g, "<span").replace(/\n/g, "<br>");
}

function createParseContext(input: string, initFEN: string, output: string): ParseContext {
	const options = parseInput(input);
	const stipulations = getStipulations(input);
	const initProblem = {
		pg: (/dia/i).test(stipulations[0]),
		fen: addImitator(toNormalFEN(initFEN), options.imitators),
		imitators: options.imitators,
		ordering: inferMoveOrdering(stipulations[0], options.halfDuplex),
	};
	const state = {
		stack: [] as Entry[],
		stipIndex: 0,
		solutionPrinted: false,
		currentProblem: initProblem,
		board: parseFEN(getInitPosition(initProblem)),
		ordering: initProblem.ordering,
		imitators: initProblem.imitators?.concat(),
	};
	const context = {
		duplexSeparator: options.duplex ? getDuplexSeparator(output) : "",
		initProblem,
		stipulations,
		options,
		state,
	};
	return context;
}

/** Reset stack */
function parseReset(context: ParseContext, text: string): boolean {
	const { state, duplexSeparator } = context;
	if(text.match(/^\n+$/)) {
		state.stack.length = 0;
		state.board = parseFEN(getInitPosition(state.currentProblem));
		if(text == duplexSeparator && state.solutionPrinted) {
			state.ordering = flipOrdering(state.ordering);
		}
		return true;
	}
	return false;
}

/** Enter twin */
function parseTwin(context: ParseContext, text: string): boolean {
	const { state, stipulations, options, initProblem } = context;
	const twin = text.match(TWIN);
	if(!twin) return false;

	state.solutionPrinted = false;
	state.currentProblem = clone(twin[1] ? state.currentProblem : initProblem);
	const stip = stipulations[++state.stipIndex];
	if(stip) {
		state.currentProblem.ordering = inferMoveOrdering(stip, options.halfDuplex);
		state.currentProblem.pg = (/dia/i).test(stip);
	}
	state.ordering = state.currentProblem.ordering;
	state.stack.length = 0;

	const { fen, board } = makeTwin(state.currentProblem.fen, twin[2]);
	state.currentProblem.fen = fen;
	state.board = state.currentProblem.pg ? parseFEN(INIT_FORSYTH) : board;
	return true;
}

const STIP = new RegExp(String.raw`${createAbbrExp("3stipulation")}\s+(\S*(?:\d|[^\d\s]\s+\d+(?:\.[05])?))`, "i");

export function getStipulations(input: string): string[] {
	return input.split(createAbbrReg("2twin", "\\b", "\\b")).map(sec => sec.match(STIP)?.[1].replace(/\s/g, "")).filter(s => s) as string[];
}

/**
 * Try to guess the WB/BW move ordering; this is needed only for castling.
 */
export function inferMoveOrdering(stip: string, halfDuplex = false): Ordering {
	if(!stip) return "wb"; // sstip not supported for the moment
	// It is assumed there that spaces are removed in stip
	const m = stip.match(/^(\d+-&gt;)?(?:exact-)?(?:(?:ser|pser|phser|semi|reci)-)?(hs|hr|h|s|r)?/i);
	let result: Ordering;
	if(!m || m[1]) result = "wb";
	else result = m[2]?.toLowerCase() == "h" ? "bw" : "wb";
	return halfDuplex ? flipOrdering(result) : result;
}

function addImitator(fen: string, imitators: string[]): string {
	if(!imitators) return fen;
	const board = parseFEN(fen);
	for(const sq of imitators) {
		board[parseSquare(sq)] = "-" + toNormalPiece("i");
	}
	return makeForsyth(board);
}

const IMITATOR = new RegExp(String.raw`\bimit\w*\s+(?:${SQ})+`, "ig");

const DUPLEX = createAbbrReg("3duplex");
const HALF_DUPLEX = createAbbrReg("3halfDuplex");

function parseInput(input: string): PopeyeOptions {
	const commands = input
		.replace(/\n/g, " ")
		.replace(COMMANDS, "\n$&")
		.split("\n");
	const options = commands.filter(c => c.match(createAbbrReg("2option", "^"))).join(" ");
	const conditions = commands.filter(c => c.match(createAbbrExp("condition"))).join(" ");
	return {
		imitators: conditions.match(IMITATOR)?.join(" ").match(new RegExp(SQ, "g")) || [],
		duplex: DUPLEX.test(options),
		halfDuplex: HALF_DUPLEX.test(options),
	};
}

function flipOrdering(order: Ordering): Ordering {
	return order == "wb" ? "bw" : "wb";
}

function getDuplexSeparator(output: string): string {
	// The idea is to find the maximal gap between solutions.
	const reg = /^\n\n+ +1\./;
	const counts = output
		.replace(/\n\nsolution finished./, "\n  1.") // in case there's no solution for duplex
		.match(/\n\n+[^\n]+/g)!
		.filter((e, i, a) => i > 0 && e.match(reg) && a[i - 1].match(reg))
		.map(h => h.match(/^\n+/)![0].length);
	return "\n".repeat(Math.max(...counts));
}

function makeStep(text: string, fen: string, animation?: string[], before?: string): string {
	const init = text == "*" ? "init " : "";
	fen = fen
		.replace(/-/g, "&#45;") // To prevent being processed again
		.replace(/"/g, "&#34;");	// Just to be safe

	let extra = "";
	if(animation && animation.length) extra += ` data-anime="${animation.join(",")}"`;
	if(before) extra += ` data-before="${before}"`;
	return `<span ${init}class="step btn px-1 py-0" data-fen="${fen}"${extra}>${text}</span>`;
}

const FEN_TOKEN = /[-+=]?(\.[0-9A-Z][0-9A-Z]|[A-Z])|\d+|\//ig;

export function toNormalFEN(fen: string): string {
	const arr = fen.match(FEN_TOKEN)!;
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
