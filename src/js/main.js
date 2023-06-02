import { createApp } from "petite-vue";
import { store, state, saveSettings } from "./store";
import { CN, FEN } from "./el";
import { squares, setSquareBG, updateSN, toFEN } from "./squares";
import { drawTemplate, draw, getBlob } from "./render";
import { setupLayout } from "./layout";
import { setupDrag } from "./drag";
import "./yacpdb";
import "./bbs";

setupLayout();
setupDrag();

//===========================================================
// export
//===========================================================

window.API = {
	toBase64() {
		gtag("event", "link_copy");
		navigator.clipboard.writeText(CN.toDataURL());
	},
	copyEmbed() {
		gtag("event", "copy_embed");
		const options = store.board;
		let url = "https://mutsuntsai.github.io/fen-tool/gen/?fen=" + FEN.value;
		if(options.size != 44) url += "&size=" + options.size;
		if(options.set != "1echecs") url += "&set=" + options.set;
		if(options.pattern) url += "&pattern=" + options.pattern;
		if(options.bg) url += "&bg=" + options.bg;
		if(options.blackWhite) url += "blackWhite&knightOffset=" + options.knightOffset;
		const size = options.size * 8 + 2;
		const html = `<iframe src="${url}" style="border:none;width:${size}px;height:${size}px"></iframe>`;
		navigator.clipboard.writeText(html);
	},
	copyImg() {
		const html = `<img fen="${FEN.value}">`;
		navigator.clipboard.writeText(html);
	},
	copySDK() {
		gtag("event", "copy_sdk");
		const options = store.board;
		let data = ""
		if(options.size != 44) data += ` data-size="${options.size}"`;
		if(options.set != "1echecs") data += ` data-set="${options.set}"`;
		if(options.bg) data += ` data-bg="${options.bg}"`;
		if(options.blackWhite) data += ` data-black-white="true" data-knight-offset="${options.knightOffset}"`;
		const html = `<script src="https://mutsuntsai.github.io/fen-tool/sdk.js"${data}></script>`;
		navigator.clipboard.writeText(html);
	},
};

window.share = async function() {
	gtag("event", "img_share");
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

createApp({
	CheckboxBase,
	Checkbox,
	draw,
	drawTemplate,
	updateBG,
	updateSN,
	store,
	state,
	tab: 0,
	saveSettings,
}).mount();
