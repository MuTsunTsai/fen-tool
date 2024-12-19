import { Chess as ChessBase } from "chess.js";

import { Color } from "app/meta/enum";
import { manipulateFEN, switchSide } from "./utils";

import type { Move, Piece, PieceSymbol, Square, Color as ChessColor } from "chess.js";
import type { Chess } from "./chess";

export type PieceSymbolR = PieceSymbol | "c";

export interface RetroMove {
	from: Square;
	to: Square;
	uncapture?: PieceSymbolR;
	unpromote?: boolean;
}

interface RetractContext {
	ep: boolean;
	type: PieceSymbol;
	uncapture?: PieceSymbolR;
	unpromote?: boolean;
	isWhite: boolean;
	temp: ChessBase;
	piece: Piece;
	rank: string;
	from: Square;
	to: Square;
}

interface CastlingRights {
	k: boolean;
	q: boolean;
}

const MAX_UNITS = 16;

export function createRetractContext(arg: RetroMove, chess: Chess): RetractContext | null {
	if(!arg) return null;
	const { from, to, unpromote } = arg;
	if(chess.get(to)) return null;

	// `c` is a special code for en passant
	const ep = arg.uncapture == "c";
	const uncapture = ep ? "p" : arg.uncapture;

	const type = chess.get(from)?.type;
	if(!basicLegalCheck(type, ep, unpromote)) return null;
	if(!epLegalCheck(chess.state.history[chess.state.moveNumber], from, to)) return null;

	const isWhite = chess.turn() == Color.black; // reversed
	const castle = chess.getCastlingRights(isWhite ? Color.white : Color.black);
	if(!castleLegalCheck(type, castle, isWhite, from)) return null;

	// Move the piece
	const fen = manipulateFEN(chess.fen(), switchSide);
	const temp = new ChessBase(fen);
	const piece = temp.remove(from);
	const rank = from[1];
	if(unpromote) piece.type = "p";
	if(piece.type == "p" && (isWhite && rank == "2" || !isWhite && rank == "7")) return null;
	if(!temp.put(piece, to)) return null;

	return { type, ep, uncapture, unpromote, isWhite, temp, piece, rank, from, to };
}

function basicLegalCheck(type: PieceSymbol | undefined, ep: boolean, unpromote?: boolean): boolean {
	if(!type) return false;
	if(ep && type != "p") return false;
	if(unpromote && (type == "p" || type == "k")) return false;
	return true;
}

function epLegalCheck(last: Move, from: Square, to: Square): boolean {
	// If the last retraction is en passant, the only legal retraction is the 2-step pawn
	if(last && last.flags == "e") {
		const expectedFrom = last.to.replace("3", "4").replace("6", "5");
		const expectedTo = last.to.replace("3", "2").replace("6", "7");
		if(from != expectedFrom || to != expectedTo) return false;
	}
	return true;
}

function castleLegalCheck(type: PieceSymbol, castle: CastlingRights, isWhite: boolean, from: Square): boolean {
	// If we've ever uncastled, the corresponding king or rook cannot be moved anymore
	if(type == "k" && (castle.k || castle.q)) return false;
	if(type == "r" && from == (isWhite ? "a1" : "a8") && castle.q) return false;
	if(type == "r" && from == (isWhite ? "h1" : "h8") && castle.k) return false;
	return true;
}

export function tryUncapture(context: RetractContext, chess: Chess): boolean {
	const { isWhite, uncapture, rank, ep, from, temp } = context;

	// legal checks
	const color = isWhite ? Color.black : Color.white;
	if(uncapture == "p" && (rank == "1" || rank == "8")) {
		console.log("Cannot uncapture a pawn at the 1st or the 8th rank.");
		return false;
	}
	if(chess.board().flat().filter(p => p && p.color == color).length >= MAX_UNITS) {
		console.log("Too many uncapturing.");
		return false;
	}

	const p = { type: uncapture as PieceSymbol, color: color as ChessColor };
	const sq = ep ? getEpSquare(from) : from;
	if(ep && rank != (isWhite ? "6" : "3")) return false;
	if(ep && temp.get(sq)) return false;
	if(!temp.put(p, sq)) return false;
	if(ep) {
		const fen = manipulateFEN(temp.fen(), arr => arr[3] = from);
		temp.load(fen);
	}

	return true;
}

function getEpSquare(sq: Square): Square {
	return sq.replace("3", "4").replace("6", "5") as Square;
}

export function tryUncastle(context: RetractContext): boolean {
	const { isWhite, piece, from, to, temp } = context;

	if(piece.type == "k" && (isWhite && to == "e1" || !isWhite && to == "e8")) {
		const rank = to[1];
		if(from == "g" + rank) {
			if(!tryRetract(temp, "f" + rank as Square, "h" + rank as Square)) return false;
			temp.setCastlingRights(piece.color, { k: true });
		}
		if(from == "c" + rank) {
			if(!tryRetract(temp, "d" + rank as Square, "a" + rank as Square)) return false;
			temp.setCastlingRights(piece.color, { q: true });
		}
	}
	return true;
}

function tryRetract(chess: ChessBase, from: Square, to: Square): boolean {
	if(chess.get(to)) return false;
	const piece = chess.remove(from);
	if(!piece) return false;
	chess.put(piece, to);
	return true;
}

export function checkRetraction(context: RetractContext): Move | null {
	const { type, unpromote, from, to, temp } = context;

	// Check if the retraction is legal
	const moves = temp.moves({ verbose: true });
	const move = moves.find(m => m.from == to && m.to == from && (!unpromote || m.promotion == type));
	if(!move) return null;
	const test = testOtherSideCheck(move.before);
	if(test.isCheck()) {
		console.log("must retract checking");
		return null;
	}
	return move;
}

export function testOtherSideCheck(fen: string): ChessBase {
	return new ChessBase(manipulateFEN(fen, switchSide));
}
