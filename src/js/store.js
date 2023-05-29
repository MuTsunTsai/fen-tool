import { reactive } from "petite-vue";

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
	board: {
		uncolored: false,
		inverted: false,
		grayBG: false,
		blackWhite: false,
		knightOffset: .5,
		SN: false,
		size: 44,
		set: "1echecs",
	},
	message: {
		touchTip: true,
	}
};

for(let key in settings) {
	Object.assign(settings[key], savedSettings[key]);
}

export const store = reactive(settings);
export const state = reactive({
	loading: true,
});

export function saveSettings() {
	localStorage.setItem("settings", JSON.stringify(store));
}
