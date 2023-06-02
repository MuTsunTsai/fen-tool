import { reactive } from "petite-vue";
import { defaultOption, parseBorder } from "./option";
import { CN } from "./el";

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
	board: defaultOption,
	message: {
		touchTip: true,
		textShortcut: true,
	}
};

for(const group in settings) {
	for(const key in settings[group]) {
		if(savedSettings[group]?.[key] !== undefined) {
			settings[group][key] = savedSettings[group][key];
		}
	}
}

export const store = reactive(settings);
window.store = store;

export const state = reactive({
	loading: true,
});

export function saveSettings() {
	localStorage.setItem("settings", JSON.stringify(store));
}

export function getRenderSize() {
	const b = parseBorder(store.board.border).size;
	const factor = CN.clientWidth / (store.board.size * 8 + b * 2);
	const s = store.board.size * factor;
	return { b: b * factor, s };
}