import { createApp } from "petite-vue";
import { store, state, saveSettings } from "./store";
import { squares, setSquareBG, updateSN, toFEN, snapshot } from "./squares";
import { drawTemplate, draw, getBlob } from "./render";
import { initLayout, setOption } from "./layout";
import { initDrag } from "./drag";
import { YACPDB, PDB, BBS, API } from "./tools";
import { Checkbox, CheckboxBase } from "./checkbox";

initLayout();
initDrag();

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
	const temp = snapshot();
	const { w, h } = store.board;
	if(w !== h) setOption({ w: h, h: w });
	for(let i = 0; i < w; i++) {
		for(let j = 0; j < h; j++) {
			const target = d == 1 ? (h - 1 - j) * w + i : j * w + (w - 1 - i);
			squares[i * h + j].value = temp[target];
		}
	}
	toFEN();
}

window.color = function(c) {
	for(const sq of squares) {
		let s = sq.value;
		if(s.substr(0, 1) == "'" || s == "") continue;
		if(s.substr(0, 1) == "-" || s.substr(0, 1) == "~") s = s.substr(1);
		s = s.toLowerCase();
		if(c == 0) s = "-" + s;
		if(c == 1) s = s.toUpperCase();
		sq.value = s;
	}
	toFEN();
}

window.invertColor = function(l) {
	for(const sq of squares) {
		let s = sq.value;
		if(s == "" || s.substr(0, 1) == "-") continue;
		if(!l && s.substr(0, 1) == "'") continue;
		t = s.toLowerCase();
		if(s == t) s = s.toUpperCase(); else s = t;
		sq.value = s;
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
