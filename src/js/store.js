import { reactive } from "petite-vue";
import { defaultOption } from "./option";

const savedSettings = JSON.parse(localStorage.getItem("settings")) || {};
const settings = {
	BBS: {
		PDB: true,
		coordinates: true,
		notes: true,
		uncoloredNotes: false,
		redBlue: false,
	},
	PDB: {
		exact: false,
	},
	YACPDB: {
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
export const state = reactive({
	loading: true,
});

export function saveSettings() {
	localStorage.setItem("settings", JSON.stringify(store));
}
