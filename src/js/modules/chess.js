import { Chess as ChessBase, DEFAULT_POSITION } from "chess.js";

export const store = {};

export class Chess extends ChessBase {

	checkPromotion(from, to) {
		const moves = this.moves({ verbose: true });
		return moves.some(m => m.from == from && m.to == to && m.flags.includes("p"));
	}

	switchSide() {
		const fen = this.fen().split(" ");
		if(fen[1] == "b") fen[1] = "w";
		else fen[1] = "b";
		this.load(fen.join(" "));
	}

	init(fen) {
		this.initFEN = fen;
		this.load(fen);
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
		const fen = h ? h.after : this.initFEN;
		this.load(fen);
		store.state.moveNumber = store.state.history.indexOf(h);
		return fen;
	}
}

const ends = ["1-0", "0-1", "1/2-1/2", "*"];

export function parseMoves(text) {
	// ignore variations
	while(text != (text = text.replace(/\([^()]*\)/g, ""))) { }
	text = text
		.replace(/\{[^}]*\}/g, "") // comments are not nested
		.replace(/;.+$/gm, "") // end-of-line comment
		.replace(/\b(\d+)\./g, "$1 .")
		.replace(/\.+/g, m => m.length > 2 ? "..." : "");
	const moves = text
		.match(/\.{3}|\S+/g)
		.filter(m => !m.match(/^\d+$/)); // ignore move numbers

	const last = moves[moves.length - 1];
	if(ends.includes(last)) moves.pop();

	if(moves[0] == "...") moves.shift();
	return moves;
}

export function number(h) {
	return h.before.match(/\d+$/)[0];
}

export function format(h) {
	let san = h.san;
	const sym = store.options.symbol;
	const symbol = sym == "unicode" ? unicode :
		sym == "german" ? german : null;
	if(symbol) {
		for(const [k, s] of Object.entries(symbol)) {
			san = san.replace(k, s);
		}
	}
	if(store.options.ep && h.flags.includes("e")) san += " e.p.";
	return san;
}

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