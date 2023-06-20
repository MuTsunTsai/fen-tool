import { toCoordinate } from "../meta/fen.mjs";
import { drawTemplate } from "../render";
import { orthodoxFEN, setFEN, setSquare, squares, toggleReadOnly } from "../squares";
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
		state.play.history.length = ++state.play.moveNumber;
		state.play.history.push(move);
		return true;
	} catch {
		return false;
	}
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
	if(!chess.checkPromotion(toCoordinate(from), toCoordinate(to))) return false;
	pendingTarget = to;
	state.play.pendingPromotion = true;
	drawTemplate(chess.turn() == "b" ? bMask : wMask)
	return true;
}

export function checkDragPrecondition(index) {
	if(state.play.pendingPromotion) return false;
	if(chess.isGameOver()) return false;
	const v = squares[index].value;
	if((v.toLowerCase() == v) != (chess.turn() == "b")) return false;
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
			state.play.playing = true;
			state.play.moveNumber = -1;
			state.play.pendingPromotion = false;
			state.play.history = [];
			toggleReadOnly(true);
			drawTemplate();
		} catch {
			alert("This board is not playable.");
		}
	},
	exit() {
		state.play.playing = false;
		state.play.game = "";
		state.play.turn = chess.turn();
		const fen = chess.fen().split(" ");
		const keys = ["K", "Q", "k", "q"];
		for(const key of keys) state.play.castle[key] = fen[2].includes(key);
		state.play.enPassant = fen[3] == "-" ? "" : fen[3];
		state.play.halfMove = Number(fen[4]);
		state.play.fullMove = Number(fen[5]);
		toggleReadOnly(false);
		drawTemplate();
	},
	goto(h) {
		const fen = h ? h.after : state.play.history[0].before;
		chess.load(fen);
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
		if(history[0].color == "b") result += PLAY.number(h) + "...";
		for(const h of history) {
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