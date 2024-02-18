import { reactive, watchEffect } from "vue";

import { defaultOption, getDimensions } from "./meta/option";
import { CN } from "./meta/el";
import { env } from "./meta/env";
import { deepAssign } from "./meta/clone";
import { defaultCustomMap, pieceMap } from "./meta/popeye/base";
import { BOARD_SIZE, TEMPLATE_SIZE } from "./meta/constants";
import { PlayMode, StockfishRunning, StockfishStatus } from "./meta/enum";

import type { PlayOption } from "./modules/chess";

export const search = new URL(location.href).searchParams;

// Persistent settings, and is synchronized across instances

const settings = {
	BBS: {
		Id: true,
		coordinates: true,
		notes: true,
		uncoloredNotes: false,
		redBlue: false,
	},
	DB: {
		use: "PDB",
		exact: false,
	},
	PLAY: {
		symbol: null,
		ep: true,
		negative: false,
		zero: false,
	} as PlayOption,
	Stockfish: {
		study: false,
		downloaded: false,
		depth: 50,
		lines: 3,
	},
	feature: {
		janko: false,
	},
	popeye: {
		pieceMap: defaultCustomMap,
	},
	board: defaultOption,
	project: [],
};

export const store = reactive(settings);
pieceMap.custom = () => store.popeye.pieceMap;

const mm = matchMedia("(prefers-color-scheme: dark)");
mm.onchange = () => status.isDark = mm.matches;

// States that are not saved into session
export const status = reactive({
	module: {
		chess: false,
	},
	envReady: false,
	loading: true,
	isDark: mm.matches,
	pieceCount: "(0+0)",
	hor: false,
	collapse: false,
	dragging: false,
	selection: null,
	stockfish: {
		status: StockfishStatus.notDownloaded,
		running: StockfishRunning.stop,
	},
	syzygy: {
		running: false,
	},
});

// Session data, will be restored on tab reloading/restoring/duplicating
// (only for top window).
export const STOCKFISH = {
	depth: 0,
	score: null,
	mate: null,
	lines: [],
	header: [],
};
const defaultState = {
	split: false,
	tab: 0,
	compute: "py",
	play: {
		initFEN: null,
		playing: false,
		pendingPromotion: false,
		moveNumber: -1,
		game: "",
		history: [],
		turn: "w",
		castle: {
			K: true,
			Q: true,
			k: true,
			q: true,
		},
		retro: {
			uncapture: null,
			unpromote: false,
			ep: false,
		},
		enPassant: "",
		halfMove: 0,
		fullMove: 1,
		mode: PlayMode.normal,
		over: undefined,
	},
	popeye: {
		initFEN: null,
		index: null,
		steps: null,
		playing: false,
		error: false,
		running: false,
		editMap: false,
		mapping: "",

		/** The actual user input. */
		input: "",

		/** The actual output displayed on UI. */
		output: "",

		/** The internal input to Popeye. */
		intInput: null,

		/** The internal output from Popeye. */
		intOutput: null,
	},
	stockfish: STOCKFISH,
	syzygy: {
		header: null,
		lines: null,
	},
};

export const state = reactive(defaultState);

/** Callbacks for registering session loading actions. */
const onSessionLoad: Action[] = [];

export function onSession(callback: Action): void {
	onSessionLoad.push(callback);
}

export function initSession(): void {
	const savedSettings = JSON.parse(localStorage.getItem("settings")) || {};
	deepAssign(settings, savedSettings, true);

	// These are the exceptions
	if(savedSettings.project) {
		settings.project = savedSettings.project;
	}
	if(savedSettings.popeye) {
		settings.popeye.pieceMap = savedSettings.popeye.pieceMap;
	}

	if(search.has("janko")) settings.feature.janko = true;

	const savedState = env.isTop ? JSON.parse(sessionStorage.getItem("state")) : null;
	if(savedState) {
		deepAssign(state, savedState);
	}

	status.stockfish.status = store.Stockfish.downloaded ? StockfishStatus.ready : StockfishStatus.notDownloaded;

	for(const action of onSessionLoad) action();

	watchEffect(saveSettings);
	watchEffect(saveSession);
}

function saveSettings(): void {
	localStorage.setItem("settings", JSON.stringify(store));
}

function saveSession(): void {
	// Save session only for top
	if(env.isTop) sessionStorage.setItem("state", JSON.stringify(state));
}

interface RenderSizeInfo {
	s: number;
	offset: IPoint & {
		r: number;
		b: number;
	};
	width: number;
}

export function getRenderSize(tp?: HTMLCanvasElement, horTemplate?: boolean, requestWidth?: number): RenderSizeInfo {
	const { size, w } = store.board;
	const { border, margin } = getDimensions(store.board, horTemplate);
	const bSize = border.size;
	const tSize = horTemplate ? BOARD_SIZE : TEMPLATE_SIZE;
	const files = tp ? tSize : w;
	const factor = (tp || CN).clientWidth / (size * files + bSize * 2 + margin.x);
	const s = size * factor;
	const offset = {
		x: (bSize + margin.x) * factor,
		y: bSize * factor,
		r: bSize * factor,
		b: (bSize + margin.y) * factor,
	};
	const width = ((requestWidth || w) * size + border.size * 2 + margin.x) * factor;
	return { s, offset, width };
}

export function noEditing(): boolean {
	return state.play.playing || state.popeye.playing;
}

export function hideTemplate(): boolean {
	return status.hor && state.popeye.playing;
}
