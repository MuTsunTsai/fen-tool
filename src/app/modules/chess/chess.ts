import { Chess as ChessBase, DEFAULT_POSITION } from "chess.js";

import { parseMoves } from "./pgn";
import { checkRetraction, createRetractContext, testOtherSideCheck, tryUncapture, tryUncastle } from "./retro";
import { bumpMove, manipulateFEN, resetMove, switchSide } from "./utils";
import { Color, PlayMode } from "app/meta/enum";
import { overState } from "./types";

import type { PlayOption } from "app/tools/play/data";
import type { PieceSymbolR, RetroMove } from "./retro";
import type { Move as CMove, PieceSymbol, Square } from "chess.js";

export interface Move extends CMove {
	annotation?: string;
}

type SquareInfo = ReturnType<ChessBase["board"]>[number];

interface MoveArgs {
	from: string;
	to: string;
	promotion?: string;
}

export interface PlayState {
	initFEN: string;
	history: Move[];
	moveNumber: number;
	mode: PlayMode;
	over?: overState;
}

type SymbolSet = Record<"K" | "Q" | "B" | "N" | "R" | "P", string>;

export type PlaySymbol = "unicode" | "german" | null;

export class Chess extends ChessBase {

	public static options: PlayOption;

	public state: PlayState;

	constructor(state = {} as PlayState) {
		super();
		this.state = state;
		this.state.history = this.state.history || [];
	}

	checkPromotion(from: string, to: string): boolean {
		const moves = this.moves({ verbose: true });
		return moves.some(m => m.from == from && m.to == to && m.flags.includes("p"));
	}

	switchSide(): void {
		this.load(manipulateFEN(this.fen(), switchSide));
	}

	init(fen: string): void {
		try {
			this.state.initFEN = fen;
			this.state.history.length = 0;
			this.state.moveNumber = -1;
			this.load(fen);

			// legal checks not covered in chess.js
			const board = this.board();
			const hasPawn = (r: SquareInfo): boolean => r.some(p => p && p.type == "p");
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
		} catch(e) {
			if(e instanceof Error) {
				const msg = e.message.replace(/^.+:/, "").trim().replace(/[^.]$/, "$&.");
				throw new Error("The position is not playable: " + msg);
			}
		}
	}

	retract(arg: RetroMove): boolean {
		const context = createRetractContext(arg, this);
		if(!context) return false;

		if(context.uncapture && !tryUncapture(context, this)) return false;
		if(!tryUncastle(context)) return false;

		const move = checkRetraction(context);
		if(!move) return false;

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
	move(arg: string | MoveArgs): Move {
		const state = this.state;
		const fen = this.fen();
		const cache = state.history.concat();

		try {
			const move = super.move(arg);
			if(this.isDraw()) move.san += "=";
			state.history.length = state.moveNumber + 1;

			const lastMove = state.history[state.history.length - 1];
			if(state.mode == PlayMode.pass && lastMove && move.color == lastMove.color && move.color == "w") {
				move.before = move.before.replace(/\d+$/, n => (Number(n) + 1).toString());
				move.after = move.after.replace(/\d+$/, n => (Number(n) + 1).toString());
			}
			this.load(move.after); // Prevent "capture king" bug of chess.js

			state.over = this.overState();
			state.history.push(move);
			state.moveNumber++;
			return move;
		} catch(e) {
			state.history = cache;
			this.load(fen);
			throw e;
		}
	}

	addMoves(moves: string[]): void {
		if(!moves || moves.length == 0) return;
		const error = this.state.mode == PlayMode.retro ?
			this.addRetroMoves(moves) :
			this.addNormalMoves(moves);
		if(error) {
			throw new Error("Something went wrong in the move: " + error);
		}
	}

	addRetroMoves(moves: string[]): string | undefined {
		for(const move of moves) {
			if(move == "...") continue;
			const retract = parseRetroMove(move);
			if(!retract || !this.retract(retract)) return move;
		}
	}

	addNormalMoves(moves: string[]): string | undefined {
		let sideDetermined = false; // Whether we're on the right track
		const isPass = this.state.mode == PlayMode.pass;
		for(const move of moves) {
			if(move == "...") {
				if(isPass) this.switchSide();
			} else if(this.move(move)) {
				sideDetermined = true;
			} else {
				if(!sideDetermined && isPass) {
					this.switchSide(); // try switch
					if(this.move(move)) continue;
				}
				return move;
			}
		}
	}

	overState(): overState {
		if(this.isCheckmate()) return overState.checkmate;
		if(this.isDraw()) return overState.draw;
		return overState.notYet;
	}

	copyGame(options?: Partial<PlayOption>, header?: Move[]): string {
		const game = header ? header.concat(this.state.history) : this.state.history;
		return formatGame(game, options);
	}

	copyPGN(header?: Move[]): string {
		let result = "";
		if(this.state.mode == PlayMode.retro) {
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
					result += m++ + ". ";
					if(i == last && history[i].color == "b") result += "... ";
				}
				result += history[i].san + " ";
			}
		} else {
			const fen = header && header.length ? header[0].before : this.state.initFEN;
			if(fen != DEFAULT_POSITION) {
				result += `[SetUp "1"]\n[FEN "${fen}"]\n\n`;
			}
			result += this.copyGame({}, header);
		}
		return result;
	}

	loadGame(text: string): void {
		const match = text.match(/\[fen "([^"]+)"\]/i);
		const fen = match ? match[1] : DEFAULT_POSITION;
		this.init(fen);
		text = text.replace(/\[[^\]]+\]/g, "").trim();
		const moves = parseMoves(text);
		this.state.mode = moves.includes("...") ? PlayMode.pass : PlayMode.normal;
		this.addMoves(moves);
		this.state.over = this.overState();
		this.goto();
	}

	goto(h?: Move): string {
		const fen = this.getFenOf(h);
		this.load(fen);
		this.state.moveNumber = h ? this.state.history.indexOf(h) : -1;
		return fen;
	}

	getFenOf(h?: Move): string {
		if(!h) return this.state.initFEN;
		return this.state.mode == PlayMode.retro ? h.before : h.after;
	}
}

export function formatGame(history: Move[], options?: Partial<PlayOption>): string {
	if(history.length == 0) return "";
	let result = "";
	if(history[0].color == Color.black) result += history[0].before.split(" ")[5] + "... ";
	for(const [i, h] of history.entries()) {
		if(history[i - 1] && history[i - 1].color == h.color) {
			if(h.color == Color.white) result += "... ";
			else result += number(h) + "... ";
		}
		if(h.color == "w") result += number(h) + ". ";
		result += format(h, undefined, options) + " ";
	}
	return result.trimEnd();
}

export function number(h: Move, mode?: PlayMode, options = Chess.options): string {
	if(!h) return "";
	const num = h.before.match(/\d+$/)![0]; // The last number in FEN
	const prefix = mode == PlayMode.retro && options.negative ? "-" : "";
	return prefix + num;
}

export function format(h: Move, mode?: PlayMode, options: Partial<PlayOption> = Chess.options): string {
	if(!h) return "";
	const isRetro = mode == PlayMode.retro;
	let move = isRetro ? getFullNotation(h) : h.san;
	const symbol = getSymbol(options.symbol);
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
	if(options.zero) move = move.replace("O-O-O", "0-0-0").replace("O-O", "0-0");
	if(h.annotation) move += h.annotation;
	return move;
}

function getSymbol(sym?: PlaySymbol): SymbolSet | null {
	if(sym == "unicode") return unicode;
	if(sym == "german") return german;
	return null;
}

function getFullNotation(h: Move): string {
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

export { parseMoves };

const unicode: SymbolSet = {
	K: "♔",
	Q: "♕",
	B: "♗",
	N: "♘",
	R: "♖",
	P: "♙",
};

const german: SymbolSet = {
	K: "K",
	Q: "D",
	B: "L",
	N: "S",
	R: "T",
	P: "B",
};

function parseRetroMove(move: string): RetroMove | null {
	const match = move.match(/^\w?([a-h][1-8])[-x](\w?)([a-h][1-8])(ep)?(?:=(\w))?/);
	if(!match) return null;
	let uncapture: PieceSymbolR | undefined;
	if(match[4]) uncapture = "c";
	else if(match[2]) uncapture = match[2].toLowerCase() as PieceSymbol;
	return {
		from: match[3] as Square,
		to: match[1] as Square,
		uncapture,
		unpromote: Boolean(match[5]),
	};
}
