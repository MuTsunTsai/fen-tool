import { reactive } from "petite-vue";
import { defaultOption, parseBorder } from "./meta/option";
import { CN } from "./meta/el";

export const search = new URL(location.href).searchParams;
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
	feature: {
		janko: false,
	},
	board: defaultOption,
	message: {
		touchTip: true,
		textShortcut: true,
	}
};

export function assign(settings, savedSettings) {
	for(const group in settings) {
		for(const key in settings[group]) {
			if(savedSettings[group] && savedSettings[group][key] !== undefined) {
				settings[group][key] = savedSettings[group][key];
			}
		}
	}
}
assign(settings, savedSettings);

if(search.has("janko")) settings.feature.janko = true;

export const store = reactive(settings);

const mm = matchMedia("(prefers-color-scheme: dark)");
mm.onchange = () => state.isDark = mm.matches;

export const state = reactive({
	loading: true,
	split: false,
	isDark: mm.matches,
	play: {
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
	}
});

export function saveSettings() {
	localStorage.setItem("settings", JSON.stringify(store));
}

export function getRenderSize(tp) {
	const { size, w, border } = store.board;
	const b = parseBorder(border).size;
	const factor = (tp || CN).clientWidth / (size * (tp ? 8 : w) + b * 2);
	const s = size * factor;
	return { b: b * factor, s };
}