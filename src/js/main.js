import { createApp } from "petite-vue";
import { store, state, saveSettings } from "./store";
import { squares, setSquareBG, updateSN, toFEN } from "./squares";
import { drawTemplate, draw, getBlob } from "./render";
import { setupLayout } from "./layout";
import { setupDrag } from "./drag";
import { YACPDB, PDB, BBS, API } from "./tools";
import { Checkbox, CheckboxBase } from "./checkbox";

setupLayout();
setupDrag();

//===========================================================
// export
//===========================================================

window.share = async function() {
	gtag("event", "fen_img_share");
	const blob = await getBlob();
	const files = [new File([blob], "board.png", { type: "image/png" })];
	navigator.share({ files });
}

//===========================================================
// manipulations
//===========================================================

window.rotate = function(d) {
	const temp = squares.map(s => s.value);
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const target = d == 1 ? (7 - j) * 8 + i : j * 8 + (7 - i);
			squares[i * 8 + j].value = temp[target];
		}
	}
	toFEN();
}

window.color = function(c) {
	for(let i = 0; i < 64; i++) {
		let s = squares[i].value;
		if(s.substr(0, 1) == "'" || s == "") continue;
		if(s.substr(0, 1) == "-" || s.substr(0, 1) == "~") s = s.substr(1);
		s = s.toLowerCase();
		if(c == 0) s = "-" + s;
		if(c == 1) s = s.toUpperCase();
		squares[i].value = s;
	}
	toFEN();
}

window.invertColor = function(l) {
	for(let i = 0; i < 64; i++) {
		let s = squares[i].value;
		if(s == "" || s.substr(0, 1) == "-") continue;
		if(!l && s.substr(0, 1) == "'") continue;
		t = s.toLowerCase();
		if(s == t) s = s.toUpperCase(); else s = t;
		squares[i].value = s;
	}
	toFEN();
}

//===========================================================
// petite-vue
//===========================================================

function updateBG() {
	setSquareBG();
	draw();
	drawTemplate();
}

const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;
const isTaiwanDesktop = navigator.languages.includes("zh-TW") && !isTouch;

createApp({
	CheckboxBase,
	Checkbox,
	draw,
	drawTemplate,
	updateBG,
	updateSN,
	get DB() {
		return store.DB.use == "PDB" ? PDB : YACPDB;
	},
	YACPDB,
	BBS,
	API,
	store,
	state,
	tab: 0,
	saveSettings,
	isTaiwanDesktop,
}).mount();
