import { toCoordinate } from "../meta/fen.mjs";
import { drawTemplate } from "../render";
import { orthodoxFEN, parseFullFEN, setFEN, setSquare, squares, toggleReadOnly } from "../squares";
import { state, store } from "../store"

let chess;
let pendingTarget;

const wMask = [4, 7, 10, 13];
const bMask = [3, 6, 9, 12];

addEventListener("keydown", e => {
	const p = state.play;
	let n = p.moveNumber;
	if(!p.playing) return;
	const k = e.key;
	if((k == "a" || k == "ArrowLeft") && n > -1) n--;
	if((k == "d" || k == "ArrowRight") && n < p.history.length - 1) n++;
	PLAY.goto(p.history[n]);
});

export function move(from, to, promotion) {
	try {
		from = toCoordinate(from);
		to = toCoordinate(to);
		const move = chess.move({ from, to, promotion });
		const p = state.play;
		if(chess.isDraw()) move.san += "=";
		p.over = overState();
		p.history.length = ++p.moveNumber;

		const lastMove = p.history[p.history.length - 1];
		if(state.play.pass && lastMove && move.color == lastMove.color && move.color == "w") {
			move.before = move.before.replace(/\d+$/, n => Number(n) + 1);
			move.after = move.after.replace(/\d+$/, n => Number(n) + 1);
			chess.load(move.after);
		}

		p.history.push(move);
		return true;
	} catch {
		return false;
	}
}

function overState() {
	if(chess.isCheckmate()) return 1;
	if(chess.isDraw()) return 2;
	return 0;
}

export function sync() {
	setFEN(chess.fen());
}

export function confirmPromotion(from, to) {
	if(move(from, pendingTarget, to)) {
		if((pendingTarget >>> 3) == 0) to = to.toUpperCase();
		setSquare(squares[pendingTarget], to);
	} else {
		sync();
	}
	state.play.pendingPromotion = false;
	drawTemplate();
}

export function checkPromotion(from, to) {
	if(state.play.pass && getSquareColor(from) != chess.turn()) chess.switchSide();
	if(!chess.checkPromotion(toCoordinate(from), toCoordinate(to))) return false;
	pendingTarget = to;
	state.play.pendingPromotion = true;
	drawTemplate(chess.turn() == "b" ? bMask : wMask)
	return true;
}

function getSquareColor(index) {
	return chess.get(toCoordinate(index)).color;
}

export function checkDragPrecondition(index) {
	if(state.play.pendingPromotion) return false;
	if(chess.isGameOver()) return false;
	if(!state.play.pass && getSquareColor(index) != chess.turn()) return false;
	return true;
}

export const PLAY = {
	async start() {
		const fen = orthodoxFEN();
		if(!fen) {
			alert("Only orthodox chess is supported.");
			return;
		}
		try {
			chess = new (await import("./modules/chess.js")).Chess(fen);
			Object.assign(state.play, {
				playing: true,
				moveNumber: -1,
				over: overState(),
				pendingPromotion: false,
				history: []
			});
			toggleReadOnly(true);
			drawTemplate();
		} catch {
			alert("This board is not playable.");
		}
	},
	exit() {
		state.play.playing = false;
		state.play.game = "";
		parseFullFEN(chess.fen());
		toggleReadOnly(false);
		drawTemplate();
	},
	goto(h) {
		const fen = h ? h.after : state.play.history[0].before;
		chess.load(fen);
		state.play.over = overState();
		state.play.moveNumber = state.play.history.indexOf(h);
		setFEN(fen);
	},
	reset() {
		Object.assign(state.play, {
			turn: "w",
			enPassant: "",
			halfMove: 0,
			fullMove: 1,
		});
		const keys = ["K", "Q", "k", "q"];
		for(const key of keys) state.play.castle[key] = true;
	},
	copyGame() {
		const history = state.play.history;
		if(history.length == 0) return "";
		let result = "";
		if(history[0].color == "b") result += "1...";
		for(const [i, h] of history.entries()) {
			if(history[i - 1] && history[i - 1].color == h.color) {
				if(h.color == "w") result += "... ";
				else result += PLAY.number(h) + "...";
			}
			if(h.color == "w") result += PLAY.number(h) + ". ";
			result += PLAY.format(h) + " ";
		}
		return result.trimEnd();
	},
	number(h) {
		return h.before.match(/\d+$/)[0];
	},
	format(h) {
		let san = h.san;
		const symbol = store.PLAY.symbol == "unicode" ? unicode :
			store.PLAY.symbol == "german" ? german : null;
		if(symbol) {
			for(const [k, s] of Object.entries(symbol)) {
				san = san.replace(k, s);
			}
		}
		if(store.PLAY.ep && h.flags.includes("e")) san += " e.p.";
		return san;
	}
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