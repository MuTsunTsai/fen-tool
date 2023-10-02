import { INIT_FORSYTH, makeForsyth, parseFEN, parseXY, toSquare } from "../fen.mjs";
import { Main, Step, setPiece, movePiece, SQ, Promotion } from "./base.mjs";
import { makeEffect } from "./effect.mjs";

const MAIN = new RegExp(Main);
const STEP = new RegExp(Step);

export function processStep(text, problem, state, factory) {
	const { stack, ordering } = state;
	const match = text.match(STEP);
	const count = match.groups.count;
	const initPosition = problem.pg ? INIT_FORSYTH : problem.fen;
	let before = null;
	if(count) {
		const index = stack.findIndex(s => s.move == count || parseInt(s.move) > parseInt(count));
		if(index >= 0) {
			// Retract
			before = index > 0 ? stack[index - 1].fen : initPosition;
			state.board = parseFEN(before);
			if(state.imitators) {
				state.imitators = (index > 0 ? stack[index - 1].imitators : problem.imitators).concat();
			}
			stack.length = index;
		}
	}
	const color = ordering[!count || count.endsWith("...") ? 1 : 0];

	// Clear all imitators first
	const { imitators, board } = state;
	const oldImitators = imitators?.concat();
	if(imitators) {
		for(const sq of imitators) setPiece(board, sq, "");
		imitators.length = 0;
	}

	// Make main moves; could have more than one (e.g. Rokagogo)
	const animation = [];
	const moves = match.groups.main.split("/");
	for(let move of moves) {
		const m = move.match(MAIN);
		makeMove(board, color, m.groups, imitators, animation);

		// Handle effects
		// Lookbehind is not supported for Safari<16.4
		const effects = move.match(/\[[^\[\]]+(?=\])/g)?.map(e => e.substring(1));
		if(effects) {
			effects.forEach(effect => makeEffect(board, effect, imitators));
		}
	}

	const fen = makeForsyth(board);
	if(count) stack.push({ move: count, color, fen, imitators: imitators?.concat() });

	// Imitator animation
	if(oldImitators) {
		for(let i = 0; i < animation.length; i++) {
			const [from, to] = animation[i].match(/[a-z]\d/g).map(c => parseXY(c));
			const dx = to.x - from.x, dy = to.y - from.y;
			for(const imitator of oldImitators) {
				const sq = parseXY(imitator);
				animation[i] += imitator + toSquare(sq.y + dy, sq.x + dx);
			}
		}
	}

	return (stack.length == 1 && count ? factory("*", initPosition) + " " : "") + factory(text, fen, animation, before);
}

function makeMove(board, color, g, imitators, animation) {
	let to, p;
	if(g.move.startsWith("0-0")) {
		const rank = color == "w" ? "1" : "8";
		const sq = g.move == "0-0" ? ["g", "h", "f"] : ["c", "a", "d"];
		movePiece(board, "e" + rank, sq[0] + rank, animation);
		p = movePiece(board, sq[1] + rank, to = sq[2] + rank, animation);
	} else {
		p = movePiece(board, g.from, to = g.to, animation);
		if(g.ep) setPiece(board, getEpSquare(g.to), ""); // en passant
		if(g.then) {
			let from = g.to;
			let tokens = g.then.match(new RegExp(`${Promotion}|${SQ}`, "g"));
			for(const token of tokens) {
				const promote = token.match(new RegExp(Promotion));
				if(promote) {
					const p = setPiece(board, from, promote.groups.p, promote.groups.pc);
					if(animation) animation[animation.length - 1] += "=" + p;
				} else {
					movePiece(board, from, token, animation);
					from = token;
				}
			}
		}
	}
	if(g.p == "I") {
		imitators.push(to);
		setPiece(board, to, "I", "n");
	} else if(g.p) {
		setPiece(board, to, p = g.p, g.pc ? g.pc : color); // promotion & Einstein
	}
	if(g.cc) setPiece(board, to, p, g.cc); // Volage
}

function getEpSquare(sq) {
	return sq.replace("3", "4").replace("6", "5");
}