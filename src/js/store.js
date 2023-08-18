import { reactive } from "petite-vue";
import { defaultOption, getDimensions } from "./meta/option";
import { CN } from "./meta/el";
import { env } from "./meta/env";
import { deepAssign } from "./meta/clone.mjs";
import { defaultCustomMap, pieceMap } from "./meta/popeye/base.mjs";

export const search = new URL(location.href).searchParams;

// Persistent settings, and is synchronized across instances
const savedSettings = JSON.parse(localStorage.getItem("settings")) || {};
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
	},
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
	message: {
		touchTip: true,
		textShortcut: true,
	}
};
deepAssign(settings, savedSettings, true);
if(savedSettings.popeye) {
	// This one is the exception
	settings.popeye.pieceMap = savedSettings.popeye.pieceMap;
}

if(search.has("janko")) settings.feature.janko = true;

/** @type {typeof settings} */
export const store = reactive(settings);
pieceMap.custom = () => store.popeye.pieceMap;

const mm = matchMedia("(prefers-color-scheme: dark)");
mm.onchange = () => status.isDark = mm.matches;

// States that are not saved into session
export const status = reactive({
	loading: true,
	isDark: mm.matches,
	pieceCount: "(0+0)",
	hor: false,
	collapse: false,
	dragging: false,
	selection: null,
	stockfish: {
		// 0=not downloaded, 1=downloading, 2=need reload, 3=ready
		status: store.Stockfish.downloaded ? 3 : 0,
		// 0=stop, 1=starting, 2=running
		running: 0,
	},
	syzygy: {
		running: false,
	},
});

// Session data, will be restored on tab reloading/restoring/duplicating
// (only for top window).
const savedState = env.isTop ? sessionStorage.getItem("state") : null;

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
		},
		enPassant: "",
		halfMove: 0,
		fullMove: 1,
		mode: "normal",
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

/** @type {typeof defaultState} */
export const state = reactive(savedState ? JSON.parse(savedState) : defaultState);
for(const key in defaultState) {
	if(!(key in state)) state[key] = defaultState[key];
}

export function saveSettings() {
	localStorage.setItem("settings", JSON.stringify(store));
}

export function saveSession() {
	// Save session only for top
	if(env.isTop) sessionStorage.setItem("state", JSON.stringify(state));
}

export function getRenderSize(tp, horTemplate, requestWidth) {
	const { size, w } = store.board;
	const { border, margin } = getDimensions(store.board, horTemplate);
	const bSize = border.size;
	const files = tp ? (horTemplate ? 8 : 3) : w;
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

export function noEditing() {
	return state.play.playing || state.popeye.playing;
}