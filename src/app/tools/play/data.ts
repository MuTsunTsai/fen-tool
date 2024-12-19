import { PlayMode, TemplateMap } from "app/meta/enum";

import type { PieceSymbolR } from "app/modules/chess/retro";
import type { PlaySymbol } from "app/modules/chess/chess";
import type { overState } from "app/modules/chess/types";
import type { Move } from "chess.js";

export const DEFAULT_PLAY_OPTIONS = {
	symbol: null as PlaySymbol,
	ep: true,
	negative: false,
	zero: false,
};

export type PlayOption = typeof DEFAULT_PLAY_OPTIONS;

export const DEFAULT_PLAY_STATE = {
	initFEN: "",
	playing: false,
	pendingPromotion: false,
	moveNumber: -1,
	game: "",
	history: [] as Move[],
	turn: "w",
	castle: {
		K: true,
		Q: true,
		k: true,
		q: true,
	},
	retro: {
		uncapture: undefined as PieceSymbolR | undefined,
		unpromote: false,
		ep: false,
	},
	enPassant: "",
	halfMove: 0,
	fullMove: 1,
	mode: PlayMode.normal,
	over: undefined as overState | undefined,
};

export interface CastlingAnimation {
	before: string;
	after: string;
	move: string;
}

export const RANK_1ST = 1;
export const RANK_8TH = 8;

const wMask = [TemplateMap.wQ, TemplateMap.wB, TemplateMap.wN, TemplateMap.wR];
const bMask = [TemplateMap.bQ, TemplateMap.bB, TemplateMap.bN, TemplateMap.bR];
const wrMask = bMask.concat(TemplateMap.bP, TemplateMap.wP, TemplateMap.bC);
const brMask = wMask.concat(TemplateMap.bP, TemplateMap.wP, TemplateMap.wC);

export const MASK = {
	w: wMask,
	b: bMask,
	wr: wrMask,
	br: brMask,
};

