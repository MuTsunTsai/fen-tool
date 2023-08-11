import { Chess as ChessBase, DEFAULT_POSITION } from "chess.js";
import { parseMoves } from "./pgn.mjs";

export class Chess extends ChessBase {

	constructor(state) {
		super();
		this.state = state || {};
		this.state.history = this.state.history || [];
	}

	checkPromotion(from, to) {
		const moves = this.moves({ verbose: true });
		return moves.some(m => m.from == from && m.to == to && m.flags.includes("p"));
	}

	switchSide() {
		this.load(manipulateFEN(this.fen(), switchSide));
	}

	init(fen) {
		this.state.initFEN = fen;
		this.state.history.length = 0;
		this.state.moveNumber = -1;
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
			this.state.initFEN = test.fen();
			this.load(this.state.initFEN);
		}
	}

	retract(arg) {
		if(!arg) return false;
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
		const last = this.state.history[this.state.moveNumber];

		// If the last retraction is en passant, the only legal retraction is the 2-step pawn
		if(last && last.flags == "e") {
			const expectedFrom = last.to.replace("3", "4").replace("6", "5");
			const expectedTo = last.to.replace("3", "2").replace("6", "7");
			if(from != expectedFrom || to != expectedTo) return false;
		}

		// If we've ever uncastled, the corresponding king or rook cannot be moved anymore
		const isWhite = this.turn() == "b";
		const castle = this.getCastlingRights(isWhite ? "w" : "b");
		if(type == "k" && (castle.k || castle.q)) return false;
		if(type == "r" && from == (isWhite ? "a1" : "a8") && castle.q) return false;
		if(type == "r" && from == (isWhite ? "h1" : "h8") && castle.k) return false;

		// Move the piece
		const fen = manipulateFEN(this.fen(), switchSide);
		const temp = new ChessBase(fen);
		const piece = temp.remove(from);
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
				if(!tryRetract(temp, "f" + rank, "h" + rank)) return false;
				temp.setCastlingRights(piece.color, { k: true });
			}
			if(from == "c" + rank) {
				if(!tryRetract(temp, "d" + rank, "a" + rank)) return false;
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
		if(this.state.moveNumber >= 0) move.before = manipulateFEN(move.before, bumpMove);
		this.load(move.before);
		const state = this.state;
		state.history.length = state.moveNumber + 1;
		state.history.push(move);
		state.moveNumber++;
		return true;
	}

	/**
	 * Make a move and return the move object.
	 */
	move(arg) {
		const state = this.state;
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
			return move;
		} catch {
			state.history = cache;
			this.load(fen);
			return null;
		}
	}

	addMoves(moves) {
		if(!moves || moves.length == 0) return;
		if(this.state.mode == "retro") {
			for(const move of moves) {
				if(move == "...") continue;
				const retract = parseRetroMove(move);
				if(!this.retract(retract)) {
					alert("Something went wrong in the move: " + move);
					break;
				}
			}
		} else {
			let sideDetermined = false; // Whether we're on the right track
			for(const move of moves) {
				if(move == "...") {
					if(this.state.pass) this.switchSide();
				} else if(this.move(move)) {
					sideDetermined = true;
				} else {
					if(!sideDetermined && this.state.pass) {
						this.switchSide(); // try switch
						if(this.move(move)) continue;
					}
					alert("Something went wrong in the move: " + move);
					break;
				}
			}
		}
	}

	overState() {
		if(this.isCheckmate()) return 1;
		if(this.isDraw()) return 2;
		return 0;
	}

	copyGame(options) {
		return formatGame(this.state.history, options);
	}

	copyPGN() {
		let result = "";
		if(this.state.mode == "retro") {
			const history = this.state.history;
			const last = history.length - 1;
			const rawFEN = history.length > 0 ? history[last].before : this.state.initFEN;
			const fen = manipulateFEN(rawFEN, resetMove);
			if(fen != DEFAULT_POSITION) {
				result += `[SetUp "1"]\n[FEN "${fen}"]\n\n`;
			}
			let m = 1;
			for(let i = last; i >= 0; i--) {
				if(history[i].color == "w" || i == last) {
					result += (m++) + ". ";
					if(i == last && history[i].color == "b") result += "... ";
				}
				result += history[i].san + " ";
			}
		} else {
			if(this.state.initFEN != DEFAULT_POSITION) {
				result += `[SetUp "1"]\n[FEN "${this.state.initFEN}"]\n\n`;
			}
			result += this.copyGame({});
		}
		return result;
	}

	loadGame(text) {
		try {
			const match = text.match(/\[fen "([^"]+)"\]/i);
			const fen = match ? match[1] : DEFAULT_POSITION;
			this.init(fen);
			text = text.replace(/\[[^\]]+\]/g, "").trim();
			const moves = parseMoves(text);
			this.state.pass = moves.includes("...");
			this.addMoves(moves);
			this.state.over = this.overState();
			this.goto();
			return true;
		} catch {
			return false;
		}
	}

	goto(h) {
		const fen = !h ? this.state.initFEN : this.state.mode == "retro" ? h.before : h.after;
		this.load(fen);
		this.state.moveNumber = this.state.history.indexOf(h);
		return fen;
	}
}

function tryRetract(c, from, to) {
	if(c.get(to)) return false;
	const piece = c.remove(from);
	if(!piece) return false;
	c.put(piece, to);
	return true;
}

export function testOtherSideCheck(fen) {
	return new ChessBase(manipulateFEN(fen, switchSide))
}

export function formatGame(history, options) {
	if(history.length == 0) return "";
	let result = "";
	if(history[0].color == "b") result += "1... ";
	for(const [i, h] of history.entries()) {
		if(history[i - 1] && history[i - 1].color == h.color) {
			if(h.color == "w") result += "... ";
			else result += number(h) + "... ";
		}
		if(h.color == "w") result += number(h) + ". ";
		result += format(h, null, options) + " ";
	}
	return result.trimEnd();
}

export function number(h, mode, options = Chess.options) {
	if(!h) return "";
	const num = h.before.match(/\d+$/)[0];
	const prefix = mode == "retro" && options.negative ? "-" : "";
	return prefix + num;
}

export function format(h, mode, options = Chess.options) {
	if(!h) return "";
	const isRetro = mode == "retro";
	let move = isRetro ? getFullNotation(h) : h.san;
	const sym = options.symbol;
	const symbol = sym == "unicode" ? unicode :
		sym == "german" ? german : null;
	if(symbol) {
		for(const [k, s] of Object.entries(symbol)) {
			move = move.replace(k, s);
		}
	}
	if((isRetro || options.ep) && h.flags.includes("e")) {
		// In retro mode, "ep" is mandatory, otherwise it would be ambiguous in general.
		// It could be inferred if the next retraction is also given, but we cannot expect that.
		move = move.replace(/([+#=]?)$/, "ep$1");
	}
	if(options.zero) move = move.replace("O-O-O", "0-0-0").replace("O-O", "0-0")
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

const switchSide = arr => {
	arr[1] = arr[1] == "b" ? "w" : "b";
	arr[3] = "-"; // Always reset ep
};
const bumpMove = arr => {
	if(arr[1] == "w") arr[5] = Number(arr[5]) + 1;
};
const resetMove = arr => {
	arr[4] = 0;
	arr[5] = 1;
};

function parseRetroMove(move) {
	const match = move.match(/^\w?([a-h][1-8])[-x](\w?)([a-h][1-8])(ep)?(?:=(\w))?/);
	if(!match) return null;
	return {
		from: match[3],
		to: match[1],
		uncapture: match[4] ? "c" : match[2] ? match[2].toLowerCase() : null,
		unpromote: Boolean(match[5]),
	};
}