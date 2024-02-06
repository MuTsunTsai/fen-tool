import { reactive, watchEffect } from "vue";
import { defaultOption, getDimensions } from "./meta/option";
import { CN } from "./meta/el";
import { env } from "./meta/env";
import { deepAssign } from "./meta/clone.mjs";
import { defaultCustomMap, pieceMap } from "./meta/popeye/base.mjs";

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
	project: [],
};

/** @type {typeof settings} */
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
		// 0=not downloaded, 1=downloading, 2=need reload, 3=ready
		status: 0,
		// 0=stop, 1=starting, 2=running
		running: 0,
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
export const state = reactive(defaultState);

/** Callbacks for registering session loading actions. */
const onSessionLoad = [];

export function onSession(callback) {
	onSessionLoad.push(callback);
}

export function initSession() {
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

	status.stockfish.status = store.Stockfish.downloaded ? 3 : 0;

	for(const action of onSessionLoad) action();

	watchEffect(saveSettings);
	watchEffect(saveSession);
}

function saveSettings() {
	localStorage.setItem("settings", JSON.stringify(store));
}

function saveSession() {
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