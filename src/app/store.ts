import { reactive, watchEffect } from "vue";

import { DEFAULT_BOARD_OPTIONS, getDimensions } from "./meta/option";
import { cnvMain } from "./meta/el";
import { env } from "./meta/env";
import { deepAssign } from "./meta/clone";
import { defaultCustomMap, pieceMap } from "./meta/popeye/base";
import { BOARD_SIZE, TEMPLATE_SIZE } from "./meta/constants";
import { StockfishRunning, StockfishStatus } from "./meta/enum";
import { DEFAULT_BBS_OPTIONS } from "./modules/ptt/options";
import { DEFAULT_PLAY_OPTIONS, DEFAULT_PLAY_STATE } from "./tools/play/data";

import type { ProjectEntry } from "./tools/project/entry";

export const search = new URL(location.href).searchParams;

// Persistent settings, and is synchronized across instances

const settings = {
	BBS: DEFAULT_BBS_OPTIONS,
	DB: {
		use: "PDB",
		exact: false,
	},
	PLAY: DEFAULT_PLAY_OPTIONS,
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
		pieceMap: defaultCustomMap as Record<string, string>,
	},
	board: DEFAULT_BOARD_OPTIONS,
	project: [] as ProjectEntry[],
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
	dragging: false as boolean | string,
	selection: null as string | null,
	stockfish: {
		status: StockfishStatus.notDownloaded,
		running: StockfishRunning.stop,
	},
	syzygy: {
		running: false,
	},
});

interface StockfishLine {
	moves: string[];
	score: number;
	pgn: string;
}

interface SyzygyLine {
	leaf: boolean;
	searching: boolean;
	pgn: string;
	indent: number;
}

// Session data, will be restored on tab reloading/restoring/duplicating
// (only for top window).
export const STOCKFISH = {
	depth: 0,
	score: null,
	mate: null,
	lines: [] as StockfishLine[],
	header: [],
};
const defaultState = {
	split: false,
	tab: 0,
	compute: "py",
	play: DEFAULT_PLAY_STATE,
	popeye: {
		initFEN: "",
		index: 0,
		steps: [] as HTMLSpanElement[],
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
		intInput: "",

		/** The internal output from Popeye. */
		intOutput: "",
	},
	stockfish: STOCKFISH,
	syzygy: {
		header: null,
		lines: null as SyzygyLine[] | null,
	},
};

export const state = reactive(defaultState);

/** Callbacks for registering session loading actions. */
const onSessionLoad: Action[] = [];

export function onSession(callback: Action): void {
	onSessionLoad.push(callback);
}

export function initSession(): void {
	const savedSettings = JSON.parse(localStorage.getItem("settings") || "{}");
	deepAssign(settings, savedSettings, true);

	// These are the exceptions
	if(savedSettings.project) {
		settings.project = savedSettings.project;
	}
	if(savedSettings.popeye) {
		settings.popeye.pieceMap = savedSettings.popeye.pieceMap;
	}

	if(search.has("janko")) settings.feature.janko = true;

	const savedState = env.isTop ? JSON.parse(sessionStorage.getItem("state") || "null") : null;
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
	const factor = (tp || cnvMain).clientWidth / (size * files + bSize * 2 + margin.x);
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
