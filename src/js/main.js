import { createApp } from "petite-vue";
import { store, state, saveSettings } from "./store";
import { CN, FEN } from "./el";
import { squares, setSquareBG, updateSN, toFEN } from "./squares";
import { drawTemplate, draw, getBlob } from "./render";
import { setupLayout } from "./layout";
import { setupDrag } from "./drag";
import { YACPDB } from "./yacpdb";
import { PDB } from "./pdb";
import { BBS } from "./bbs";
import { parseBorder } from "./option";

setupLayout();
setupDrag();

//===========================================================
// export
//===========================================================

function getURL(url) {
	return new URL(url, location.href).toString();
}

const API = {
	toBase64() {
		gtag("event", "fen_link_copy");
		navigator.clipboard.writeText(CN.toDataURL());
	},
	copyEmbed() {
		gtag("event", "fen_copy_embed");
		const options = store.board;

		let url = getURL("gen/?fen=" + FEN.value);
		if(options.size != 44) url += "&size=" + options.size;
		if(options.set != "1echecs") url += "&set=" + options.set;
		if(options.pattern) url += "&pattern=" + options.pattern;
		if(options.bg) url += "&bg=" + options.bg;
		if(options.border != "1") url += "&border=" + options.border;
		if(options.blackWhite) url += "&blackWhite&knightOffset=" + options.knightOffset;
		const borderSize = parseBorder(options.border).size;
		const w = options.size * 8 + 2 * borderSize;
		const h = options.size * 8 + 2 * borderSize;
		const html = `<iframe src="${url}" style="border:none;width:${w}px;height:${h}px"></iframe>`;
		navigator.clipboard.writeText(html);
	},
	copyImg() {
		const html = `<img fen="${FEN.value}">`;
		navigator.clipboard.writeText(html);
	},
	copySDK() {
		gtag("event", "fen_copy_sdk");
		const options = store.board;
		let data = ""
		if(options.size != 44) data += ` data-size="${options.size}"`;
		if(options.set != "1echecs") data += ` data-set="${options.set}"`;
		if(options.bg) data += ` data-bg="${options.bg}"`;
		if(options.border != "1") data += ` data-border="${options.border}"`;
		if(options.blackWhite) data += ` data-black-white="true" data-knight-offset="${options.knightOffset}"`;
		const html = `<script src="${getURL("sdk.js")}"${data}></script>`;
		navigator.clipboard.writeText(html);
	},
};

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

let checkboxId = 0;

function CheckboxBase(checked, label, onchange) {
	return {
		$template: "#checkbox",
		id: "chk" + checkboxId++,
		label,
		checked,
		change: event => {
			if(onchange) onchange(event.target.checked);
		},
	};
}

function Checkbox(key, label, onchange) {
	const path = key.split(".");
	key = path.pop();
	let target = store;
	while(path.length) target = target[path.shift()];
	return CheckboxBase(() => target[key], label, v => {
		target[key] = v;
		if(onchange) onchange();
	});
}

function updateBG() {
	setSquareBG();
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
