import { INIT_FORSYTH, makeForsyth, parseFEN } from "../fen.mjs";
import { Main, Step, setPiece, movePiece } from "./base.mjs";
import { makeEffect } from "./effect.mjs";

const MAIN = new RegExp(Main);
const STEP = new RegExp(Step);

export function processStep(text, problem, state) {
	const { stack, ordering } = state;
	const match = text.match(STEP);
	const count = match.groups.count;
	if(count) {
		const index = stack.findIndex(s => s.move == count || parseInt(s.move) > parseInt(count));
		if(index >= 0) {
			// Retract
			const fen = index > 0 ? stack[index - 1].fen : problem.pg ? INIT_FORSYTH : problem.fen;
			state.board = parseFEN(fen);
			if(state.imitators) {
				state.imitators = (index > 0 ? stack[index - 1].imitators : problem.imitators).concat();
			}
			stack.length = index;
		}
	}
	const color = ordering[!count || count.endsWith("...") ? 1 : 0];

	// Clear all imitators first
	const { imitators, board } = state;
	if(imitators) {
		for(const sq of imitators) setPiece(board, sq, "");
		imitators.length = 0;
	}

	// Make main moves; could have more than one (e.g. Rokagogo)
	const moves = match.groups.main.split("/");
	for(let move of moves) {
		const m = move.match(MAIN);
		makeMove(board, color, m.groups, imitators);

		// Handle effects
		const effects = move.match(/(?<=\[)[^\[\]]+(?=\])/g);
		if(effects) {
			effects.forEach(effect => makeEffect(board, effect, imitators));
		}
	}

	const fen = makeForsyth(board);
	if(count) stack.push({ move: count, color, fen, imitators: imitators?.concat() })
	return fen;
}

function makeMove(board, color, g, imitators) {
	let to, p;
	if(g.move.startsWith("0-0")) {
		const rank = color == "w" ? "1" : "8";
		const sq = g.move == "0-0" ? ["g", "h", "f"] : ["c", "a", "d"];
		movePiece(board, "e" + rank, sq[0] + rank);
		p = movePiece(board, sq[1] + rank, to = sq[2] + rank);
	} else {
		p = movePiece(board, g.from, to = g.to);
		if(g.ep) setPiece(board, getEpSquare(g.to), ""); // en passant
		if(g.then) movePiece(board, g.to, to = g.then); // Take&Make
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