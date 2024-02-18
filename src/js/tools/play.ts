import { animate, stopAnimation } from "../animation";
import { readText } from "../copy";
import { types } from "../draw";
import { makeForsyth, parseFEN, parseSquare, toSquare } from "../meta/fen";
import { drawTemplate, load } from "../render";
import { orthodoxFEN, parseFullFEN, setFEN, setSquare, squares, toggleReadOnly } from "../squares";
import { onSession, state, status, store } from "../store";
import { alert } from "../meta/dialogs";
import { Color, PlayMode, TemplatePieces } from "../meta/enum";
import { BOARD_SIZE } from "js/meta/constants";

import type * as ChessModule from "../modules/chess";
import type { Square } from "chess.js";

interface CastlingAnimation {
	before: string;
	after: string;
	move: string;
}

const RANK_1ST = 1;
const RANK_8TH = 8;

onSession(() => {
	// Restore playing session
	if(state.play.playing) {
		const p = state.play;
		p.playing = false;
		Promise.all([load(), loadChessModule()]).then(() => {
			start();
			PLAY.goto(p.history[p.moveNumber]);
		});
	}
});

let module: typeof ChessModule;
let chess: ChessModule.Chess;
let pendingTarget: number;

const wMask = [TemplatePieces.wQ, TemplatePieces.wB, TemplatePieces.wN, TemplatePieces.wR];
const bMask = [TemplatePieces.bQ, TemplatePieces.bB, TemplatePieces.bN, TemplatePieces.bR];

const wrMask = bMask.concat(TemplatePieces.bP, TemplatePieces.wP, TemplatePieces.bC);
const brMask = wMask.concat(TemplatePieces.bP, TemplatePieces.wP, TemplatePieces.wC);

export function moveHistory(v: number): void {
	const p = state.play;
	let n = p.moveNumber;
	n += v;
	if(n < -1) n = -1;
	if(n > p.history.length - 1) n = p.history.length - 1;
	if(n != p.moveNumber) goto(n);
}

function goto(n: number): void {
	const p = state.play;
	const m = p.moveNumber;
	const shouldAnimate = n >= 0 || m == 0;
	PLAY.goto(p.history[n], shouldAnimate);
	if(shouldAnimate) {
		const back = n == m - 1;
		const move = p.history[back ? m : n];
		let act = move.from + move.to;
		if(move.flags == "k" || move.flags == "q") act += "," + castlingRookMove(move);
		animate(move.before, move.after, act, back != (state.play.mode == PlayMode.retro));
	}
}

export function makeMove(fromIndex: number, toIndex: number, promotion?: string): boolean | CastlingAnimation {
	const from = toSquare(fromIndex) as Square;
	const to = toSquare(toIndex) as Square;
	if(state.play.mode == PlayMode.retro) {
		const result = chess.retract({ from, to, ...state.play.retro });
		if(result) {
			resetRetro();
			drawRetroTemplate();
		}
		return result;
	} else {
		const move = chess.move({ from, to, promotion });
		if(!move) return false;
		if(move.flags == "k" || move.flags == "q") return generateCastlingAnimation(move);
		return true;
	}
}

function generateCastlingAnimation(move: ChessModule.Move): CastlingAnimation {
	const board = parseFEN(move.before);
	const isWhite = move.color == Color.white;
	board[parseSquare(move.from)] = "";
	board[parseSquare(move.to)] = isWhite ? "K" : "k";
	return {
		before: makeForsyth(board),
		after: move.after,
		move: castlingRookMove(move),
	};
}

function castlingRookMove(move: ChessModule.Move): string {
	const isWhite = move.color == Color.white;
	const isKing = move.flags == "k";
	const rank = isWhite ? RANK_1ST : RANK_8TH;
	const fromFile = isKing ? "h" : "a";
	const toFile = isKing ? "f" : "d";
	return fromFile + rank + toFile + rank;
}

export function sync(): void {
	setFEN(chess.fen());
}

export function confirmPromotion(from: number, to: string): void {
	if(makeMove(from, pendingTarget, to)) {
		if(pendingTarget < BOARD_SIZE) to = to.toUpperCase();
		setSquare(squares[pendingTarget], to);
	} else {
		sync();
	}
	state.play.pendingPromotion = false;
	drawTemplate([]);
}

export function checkPromotion(from: number, to: number): boolean {
	const mode = state.play.mode;
	if(mode == PlayMode.retro) return false;
	if(mode == PlayMode.pass && getSquareColor(from) != chess.turn()) chess.switchSide();
	if(!chess.checkPromotion(toSquare(from), toSquare(to))) return false;
	pendingTarget = to;
	state.play.pendingPromotion = true;
	drawTemplate(chess.turn() == Color.black ? bMask : wMask);
	return true;
}

function getSquareColor(index: number): Color {
	return chess.get(toSquare(index) as Square).color as Color;
}

export function checkDragPrecondition(index: number): boolean {
	const mode = state.play.mode;
	if(state.play.pendingPromotion) return false;
	if(mode != PlayMode.retro && chess.isGameOver()) return false;
	const colorMatchTurn = getSquareColor(index) == chess.turn();
	if(mode != PlayMode.pass && colorMatchTurn != (mode == PlayMode.normal)) return false;
	return true;
}

export async function loadChessModule(): Promise<typeof ChessModule> {
	if(!module) {
		// break into 2 lines to prevent SSG trying to resolve this path.
		const path = "./modules/chess.js";
		const m = await import(path);
		if(!module) {
			module = m;
			module.Chess.options = store.PLAY;
			chess = new module.Chess(state.play);
			status.module.chess = true;
		}
	}
	return module;
}

function start(): void {
	Object.assign(state.play, {
		playing: true,
		pendingPromotion: false,
	});
	toggleReadOnly(true);
	if(state.play.mode == PlayMode.retro) {
		resetRetro();
		drawRetroTemplate();
	} else { drawTemplate([]); }
}

function resetRetro(): void {
	state.play.retro = {
		uncapture: null,
		unpromote: false,
		ep: false,
	};
}

function drawRetroTemplate(): void {
	drawTemplate(chess.turn() == Color.black ? wrMask : brMask);
}

export function retroClick(x: number, y: number): void {
	if(x == 2) return;
	const retro = state.play.retro;
	const matchTurn = x == 0 == (chess.turn() == Color.black);
	const toggle = (p: string): void => { retro.uncapture = retro.uncapture == p ? null : p; };
	if(matchTurn) {
		if(0 < y && y < 7) toggle(types[y]);
		if(y == 5 || y == 6) retro.unpromote = false;
	} else if(y == 5) {
		retro.unpromote = !retro.unpromote;
		if(retro.uncapture == "p" || retro.uncapture == "c") retro.uncapture = null;
	}
	drawRetroTemplate();
}

export async function importGame(text: string): Promise<void> {
	await loadChessModule();
	try {
		chess.loadGame(text);
		sync();
		start();
	} catch(e) {
		if(e instanceof Error) alert(e.message);
	}
}

export const PLAY = {
	async start() {
		try {
			const fen = orthodoxFEN();
			if(!fen) throw new Error("Only orthodox chess is supported.");

			await loadChessModule();
			chess.init(fen);
			state.play.over = chess.overState();
			start();
		} catch(e) {
			alert(e instanceof Error ? e.message : e);
		}
		gtag("event", "fen_play_" + state.play.mode);
	},
	exit() {
		state.play.playing = false;
		state.play.game = "";
		setFEN(state.play.initFEN);
		parseFullFEN(state.play.initFEN);
		toggleReadOnly(false);
		drawTemplate([]);
	},
	goto(h?: ChessModule.Move, skipSet?: boolean) {
		if(state.play.pendingPromotion) {
			state.play.pendingPromotion = false;
			drawTemplate([]);
		}
		const fen = chess.goto(h);
		if(!skipSet) {
			stopAnimation();
			setFEN(fen);
		}
		if(state.play.mode == PlayMode.retro) {
			resetRetro();
			drawRetroTemplate();
		}
	},
	move(n: number) {
		const p = state.play;
		if(n != p.moveNumber) goto(n);
	},
	moveBy(v: number) {
		moveHistory(v);
	},
	copyGame() {
		return chess.copyGame();
	},
	copyPGN() {
		return chess.copyPGN();
	},
	number(h: ChessModule.Move) {
		return module.number(h, state.play.mode);
	},
	format(h: ChessModule.Move) {
		return module.format(h, state.play.mode);
	},
	async pasteMoves() {
		const text = await readText();
		try {
			chess.addMoves(module.parseMoves(text));
		} catch(e) {
			if(e instanceof Error) alert(e.message);
		}
		sync();
	},
	async pasteGame() {
		const text = await readText();
		await importGame(text);
	},
};
