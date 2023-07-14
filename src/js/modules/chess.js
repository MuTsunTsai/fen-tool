import { Chess as ChessBase, DEFAULT_POSITION } from "chess.js";
import { parseMoves } from "./pgn.mjs";

export const store = {};

export class Chess extends ChessBase {

	checkPromotion(from, to) {
		const moves = this.moves({ verbose: true });
		return moves.some(m => m.from == from && m.to == to && m.flags.includes("p"));
	}

	switchSide() {
		this.load(manipulateFEN(this.fen(), switchSide));
	}

	init(fen) {
		this.initFEN = fen;
		store.state.history.length = 0;
		store.state.moveNumber = -1;
		this.load(fen);

		// legal checks not covered in chess.js
		const board = this.board();
		const hasPawn = r => r.some(p => p && p.type == "p");
		if(hasPawn(board[0]) || hasPawn(board[7])) {
			throw new Error("pawns cannot be on the 1st or the 8th rank");
		}

		const test = testOtherSideCheck(fen);
		if(test.isCheck()) {
			if(this.isCheck()) throw new Error("both kings are under checks");
			// automatically switch turn regardless of assignment
			this.initFEN = test.fen();
			this.load(this.initFEN);
		}
	}

	retract(arg) {
		const { from, to, unpromote } = arg;
		if(this.get(to)) return false;

		// `c` is a special code for en passant
		const ep = arg.uncapture == "c";
		const uncapture = ep ? "p" : arg.uncapture;

		// Basic legal checks
		const type = this.get(from)?.type;
		if(!type) return false;
		if(ep && type != "p") return false;
		if(unpromote && (type == "p" || type == "k")) return false;
		const last = store.state.history[store.state.moveNumber];
		if(last && last.flags == "e") { // last move is en passant
			const expectedFrom = last.to.replace("3", "4").replace("6", "5");
			const expectedTo = last.to.replace("3", "2").replace("6", "7");
			if(from != expectedFrom || to != expectedTo) return false;
		}

		// If we've ever uncastled, the corresponding king or rook cannot be moved anymore
		const castle = this.getCastlingRights(this.turn() == "w" ? "b" : "w");
		if(type == "k" && (castle.k || castle.q)) return false;
		if(type == "r" && from[0] == "a" && castle.q) return false;
		if(type == "r" && from[0] == "h" && castle.k) return false;

		// Move the piece
		const fen = manipulateFEN(this.fen(), switchSide, arr => arr[3] = "-");
		const temp = new Chess(fen);
		const piece = temp.remove(from);
		const isWhite = piece.color == "w";
		const rank = from[1];
		if(unpromote) piece.type = "p";
		if(piece.type == "p" && (isWhite && rank == "2" || !isWhite && rank == "7")) return false;
		if(!temp.put(piece, to)) return false;

		// Uncapture
		if(uncapture) {
			// legal checks
			const color = isWhite ? "b" : "w";
			if(uncapture == "p" && (rank == "1" || rank == "8")) {
				console.log("Cannot uncapture a pawn at the 1st or the 8th rank.");
				return false;
			}
			if(this.board().flat().filter(p => p && p.color == color).length >= 16) {
				console.log("Too many uncapturing.");
				return false;
			}

			const p = { type: uncapture, color };
			const sq = ep ? getEpSquare(from) : from;
			if(ep && rank != (isWhite ? "6" : "3")) return false;
			if(ep && temp.get(sq)) return false;
			if(!temp.put(p, sq)) return false;
			if(ep) {
				const fen = manipulateFEN(temp.fen(), arr => arr[3] = from);
				temp.load(fen);
			}
		}

		// Castling
		if(piece.type == "k" && (isWhite && to == "e1" || !isWhite && to == "e8")) {
			const rank = to[1];
			if(from == "g" + rank) {
				if(!temp._tryRetract("f" + rank, "h" + rank)) return false;
				temp.setCastlingRights(piece.color, { k: true });
			}
			if(from == "c" + rank) {
				if(!temp._tryRetract("d" + rank, "a" + rank)) return false;
				temp.setCastlingRights(piece.color, { q: true });
			}
		}

		// Check if the retraction is legal
		const moves = temp.moves({ verbose: true });
		const move = moves.find(m => m.from == to && m.to == from && (!unpromote || m.promotion == type));
		if(!move) return false;
		const test = testOtherSideCheck(move.before);
		if(test.isCheck()) {
			console.log("must retract checking");
			return false;
		}

		// Update state of self
		if(store.state.moveNumber >= 0) move.before = manipulateFEN(move.before, bumpMove);
		this.load(move.before);
		const state = store.state;
		state.history.length = state.moveNumber + 1;
		state.history.push(move);
		state.moveNumber++;
		return true;
	}

	_tryRetract(from, to) {
		if(this.get(to)) return false;
		this.put(this.remove(from), to);
		return true;
	}

	move(arg) {
		const state = store.state;
		const fen = this.fen();
		const cache = state.history.concat();

		try {
			const move = super.move(arg);
			if(this.isDraw()) move.san += "=";
			state.history.length = state.moveNumber + 1;

			const lastMove = state.history[state.history.length - 1];
			if(state.pass && lastMove && move.color == lastMove.color && move.color == "w") {
				move.before = move.before.replace(/\d+$/, n => Number(n) + 1);
				move.after = move.after.replace(/\d+$/, n => Number(n) + 1);
			}
			this.load(move.after); // Prevent "capture king" bug of chess.js

			state.over = this.overState();
			state.history.push(move);
			state.moveNumber++;
			return true;
		} catch {
			state.history = cache;
			this.load(fen);
			return false;
		}
	}

	addMoves(moves) {
		let sideDetermined = false; // Whether we're on the right track
		if(!moves || moves.length == 0) return;
		for(const move of moves) {
			if(move == "...") {
				if(store.state.pass) this.switchSide();
			} else if(this.move(move)) {
				sideDetermined = true;
			} else {
				if(!sideDetermined && store.state.pass) {
					this.switchSide(); // try switch
					if(this.move(move)) continue;
				}
				alert("Something went wrong in the move: " + move);
				break;
			}
		}
	}

	overState() {
		if(this.isCheckmate()) return 1;
		if(this.isDraw()) return 2;
		return 0;
	}

	copyGame() {
		const history = store.state.history;
		if(history.length == 0) return "";
		let result = "";
		if(history[0].color == "b") result += "1... ";
		for(const [i, h] of history.entries()) {
			if(history[i - 1] && history[i - 1].color == h.color) {
				if(h.color == "w") result += "... ";
				else result += number(h) + "... ";
			}
			if(h.color == "w") result += number(h) + ". ";
			result += format(h) + " ";
		}
		return result.trimEnd();
	}

	copyPGN() {
		let result = ""
		if(this.initFEN != DEFAULT_POSITION) {
			result += `[SetUp "1"]\n[FEN "${this.initFEN}"]\n\n`;
		}
		result += this.copyGame();
		return result;
	}

	loadGame(text) {
		try {
			const match = text.match(/\[fen "([^"]+)"\]/i);
			const fen = match ? match[1] : DEFAULT_POSITION;
			this.init(fen);
			text = text.replace(/\[[^\]]+\]/g, "").trim();
			const moves = parseMoves(text);
			store.state.pass = moves.includes("...");
			this.addMoves(moves);
			store.state.over = this.overState();
			this.goto();
			return true;
		} catch {
			return false;
		}
	}

	goto(h) {
		const fen = !h ? this.initFEN : store.state.mode == "retro" ? h.before : h.after;
		this.load(fen);
		store.state.moveNumber = store.state.history.indexOf(h);
		return fen;
	}
}

export function testOtherSideCheck(fen) {
	return new ChessBase(manipulateFEN(fen, switchSide, arr => arr[3] = "-"))
}

export function number(h) {
	const num = h.before.match(/\d+$/)[0];
	const prefix = store.state.mode == "retro" && store.options.negative ? "-" : "";
	return prefix + num;
}

export function format(h) {
	let move = store.state.mode == "retro" ? getFullNotation(h) : h.san;
	const sym = store.options.symbol;
	const symbol = sym == "unicode" ? unicode :
		sym == "german" ? german : null;
	if(symbol) {
		for(const [k, s] of Object.entries(symbol)) {
			move = move.replace(k, s);
		}
	}
	if(store.options.ep && h.flags.includes("e")) move = move.replace(/([+#=]?)$/, "ep$1");
	if(store.options.zero) move = move.replace("O-O-O", "0-0-0").replace("O-O", "0-0")
	return move;
}

function getFullNotation(h) {
	if(h.flags == "k" || h.flags == "q") return h.san; // castling
	const p = h.piece.toUpperCase();
	const c = h.captured ? h.captured.toUpperCase() : "";
	const e = h.san.match(/[+#=]$/);
	const suffix = e ? e[0] : "";
	return (p == "P" ? "" : p) + h.from +
		(h.captured ? "x" + c : "-") +
		h.to +
		(h.promotion ? "=" + h.promotion.toUpperCase() : "") +
		suffix;
}

function getEpSquare(sq) {
	return sq.replace("3", "4").replace("6", "5");
}

export { parseMoves };

const unicode = {
	"K": "♔",
	"Q": "♕",
	"B": "♗",
	"N": "♘",
	"R": "♖",
	"P": "♙",
};

const german = {
	"K": "K",
	"Q": "D",
	"B": "L",
	"N": "S",
	"R": "T",
	"P": "B",
};

function manipulateFEN(fen, ...factories) {
	const arr = fen.split(" ");
	for(const factory of factories) factory(arr);
	return arr.join(" ");
}

function switchSide(arr) {
	arr[1] = arr[1] == "b" ? "w" : "b";
}

function bumpMove(arr) {
	if(arr[1] == "w") arr[5] = Number(arr[5]) + 1;
}
