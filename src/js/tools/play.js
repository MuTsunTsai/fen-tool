import { readText } from "../copy";
import { types } from "../draw";
import { toCoordinate } from "../meta/fen.mjs";
import { drawTemplate } from "../render";
import { orthodoxFEN, parseFullFEN, setFEN, setSquare, squares, toggleReadOnly } from "../squares";
import { state, store } from "../store"

let module;
let chess;
let pendingTarget;

const NORMAL = "normal", PASS = "pass", RETRO = "retro";

const wMask = [4, 7, 10, 13];
const bMask = [3, 6, 9, 12];

const wrMask = bMask.concat(15, 16, 18);
const brMask = wMask.concat(15, 16, 19);

addEventListener("keydown", e => {
	const p = state.play;
	let n = p.moveNumber;
	if(!p.playing) return;
	const k = e.key;
	if(k == "a" || k == "ArrowLeft") {
		e.preventDefault();
		if(n > -1) n--;
	}
	if(k == "d" || k == "ArrowRight") {
		e.preventDefault();
		if(n < p.history.length - 1) n++;
	}
	if(n != p.moveNumber) PLAY.goto(p.history[n]);
});

export function move(from, to, promotion) {
	from = toCoordinate(from);
	to = toCoordinate(to);
	if(state.play.mode == RETRO) {
		const result = chess.retract({ from, to, ...state.play.retro });
		if(result) {
			resetRetro();
			drawRetroTemplate();
		}
		return result;
	} else {
		return chess.move({ from, to, promotion });
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
	drawTemplate([]);
}

export function checkPromotion(from, to) {
	const mode = state.play.mode;
	if(mode == RETRO) return false;
	if(mode == PASS && getSquareColor(from) != chess.turn()) chess.switchSide();
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
	const mode = state.play.mode;
	if(state.play.pendingPromotion) return false;
	if(mode != RETRO && chess.isGameOver()) return false;
	const colorMatchTurn = getSquareColor(index) == chess.turn();
	if(mode != PASS && colorMatchTurn != (mode == NORMAL)) return false;
	return true;
}

async function loadModule() {
	if(!module) {
		module = await import("./modules/chess.js");
		module.store.state = state.play;
		module.store.options = store.PLAY;
		chess = new module.Chess();
	}
}

function start() {
	Object.assign(state.play, {
		playing: true,
		pendingPromotion: false,
	});
	toggleReadOnly(true);
	if(state.play.mode == RETRO) {
		resetRetro();
		drawRetroTemplate();
	} else drawTemplate([]);
}

function resetRetro() {
	state.play.retro = {
		uncapture: null,
		unpromote: false,
		ep: false,
	};
}

function drawRetroTemplate() {
	drawTemplate(chess.turn() == "b" ? wrMask : brMask);
}

export function retroClick(x, y) {
	if(x == 2) return;
	const retro = state.play.retro;
	const matchTurn = (x == 0) == (chess.turn() == "b")
	const toggle = p => retro.uncapture = retro.uncapture == p ? null : p;
	if(matchTurn) {
		if(0 < y && y < 7) toggle(types[y]);
		if(y == 5 || y == 6) retro.unpromote = false;
	} else if(y == 5) {
		retro.unpromote = !retro.unpromote;
		if(retro.uncapture == "p" || retro.uncapture == "c") retro.uncapture = null;
	}
	drawRetroTemplate();
}

export const PLAY = {
	async start() {
		const fen = orthodoxFEN();
		if(!fen) {
			alert("Only orthodox chess is supported.");
			return;
		}

		try {
			await loadModule();
			chess.init(fen);
			state.play.over = chess.overState();
			start();
		} catch(e) {
			alert("This board is not playable: " + e.message.replace(/^.+:/, "").trim().replace(/[^.]$/, "$&."));
		}
	},
	exit() {
		state.play.playing = false;
		state.play.game = "";
		parseFullFEN(chess.fen());
		toggleReadOnly(false);
		drawTemplate([]);
	},
	goto(h) {
		setFEN(chess.goto(h));
		if(state.play.mode == RETRO) {
			resetRetro();
			drawRetroTemplate();
		}
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
		return chess.copyGame();
	},
	copyPGN() {
		return chess.copyPGN();
	},
	number(h) {
		return module.number(h);
	},
	format(h) {
		return module.format(h);
	},
	async pasteMoves() {
		const text = await readText();
		chess.addMoves(module.parseMoves(text));
	},
	async pasteGame() {
		const text = await readText();
		await loadModule();
		if(chess.loadGame(text)) {
			sync();
			start();
		}
	}
}
