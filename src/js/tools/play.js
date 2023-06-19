import { toCoordinate } from "../meta/fen.mjs";
import { drawTemplate } from "../render";
import { orthodoxFEN, setFEN, setSquare, squares, toggleReadOnly } from "../squares";
import { state } from "../store"

let chess;
let pendingTarget;

const wMask = [4, 7, 10, 13];
const bMask = [3, 6, 9, 12];

export function move(from, to, promotion) {
	console.log(from, to, promotion);
	try {
		from = toCoordinate(from >>> 3, from % 8);
		to = toCoordinate(to >>> 3, to % 8);
		chess.move({ from, to, promotion });
		state.play.moveNumber++;
		state.play.game = score();
		return true;
	} catch {
		return false;
	}
}

export function confirmPromotion(from, to) {
	if(move(from, pendingTarget, to)) {
		if((pendingTarget >>> 3) == 0) to = to.toUpperCase();
		setSquare(squares[pendingTarget], to);
	} else {
		setFEN(chess.fen());
	}
	state.play.pendingPromotion = false;
	drawTemplate();
}

export function checkPromotion(v, index) {
	const y = index >>> 3;
	if(v == "P" && y == 0 || v == "p" && y == 7) {
		pendingTarget = index;
		state.play.pendingPromotion = true;
		drawTemplate(v == "p" ? bMask : wMask)
		return true;
	}
	return false;
}

export function checkDragPrecondition(index) {
	if(state.play.pendingPromotion) return false;
	if(chess.isGameOver()) return false;
	const v = squares[index].value;
	if((v.toLowerCase() == v) != (chess.turn() == "b")) return false;
	return true;
}

function score() {
	return chess.pgn().replace(/\[[^\]]+\]\s/g, "").replace(/^\s+/, "");
}

export const PLAY = {
	async start() {
		const fen = orthodoxFEN();
		console.log(fen);
		if(!fen) {
			alert("Only orthodox chess is supported.");
			return;
		}
		try {
			chess = new (await import("./modules/chess.js")).Chess(fen);
			state.play.playing = true;
			state.play.moveNumber = 0;
			state.play.pendingPromotion = false;
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
	undo() {
		if(chess.undo()) {
			setFEN(chess.fen());
			state.play.game = score();
			state.play.moveNumber--;
		}
	},
	reset() {
		Object.assign(state.play, {
			turn: "w",
			castle: {
				K: true,
				Q: true,
				k: true,
				q: true,
			},
			enPassant: "",
			halfMove: 0,
			fullMove: 1,
		});
	}
}