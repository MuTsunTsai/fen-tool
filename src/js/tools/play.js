import { toCoordinate } from "../meta/fen.mjs";
import { drawTemplate } from "../render";
import { orthodoxFEN, parseFullFEN, setFEN, setSquare, squares, toggleReadOnly } from "../squares";
import { state, store } from "../store"

let module;
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
	from = toCoordinate(from);
	to = toCoordinate(to);
	return chess.move({ from, to, promotion });
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
		moveNumber: -1,
		pendingPromotion: false,
	});
	toggleReadOnly(true);
	drawTemplate([]);
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
			state.play.history = [];
			state.play.over = chess.overState();
			start();
		} catch(e) {
			alert("This board is not playable:" + e.message.replace(/^.+:/, "").replace(/[^.]$/, "$&."));
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
		const text = await navigator.clipboard.readText();
		chess.addMoves(module.parseMoves(text));
	},
	async pasteGame() {
		const text = await navigator.clipboard.readText();
		await loadModule();
		if(chess.loadGame(text)) {
			sync();
			start();
		}
	}
}
