import { createApp } from "petite-vue";
import { Checkbox, CheckboxBase, CheckboxR } from "./checkbox";
import { CopyButton, copyImage } from "./copy";

import { store, state, status, saveSettings, saveSession, noEditing } from "./store";
import { updateSN, toFEN, updateEdwards } from "./squares";
import { drawTemplate, draw, getBlob, drawEmpty, load } from "./render";
import { initLayout, setOption } from "./layout";
import { initDrag } from "./drag";
import { env } from "./meta/env";
import { SN } from "./meta/el";

import { YACPDB } from "./tools/yacpdb";
import { PDB } from "./tools/pdb";
import { BBS } from "./tools/bbs";
import { API, normalForsyth } from "./tools/api";
import { PLAY, moveHistory } from "./tools/play";
import { Popeye } from "./tools/popeye";
import { openFile } from "./tools/scan";

initLayout();
initDrag();

// https://stackoverflow.com/a/43321596/9953396
document.addEventListener('mousedown', function(event) {
	const el = document.activeElement?.nodeName.toLowerCase();
	if(el == "input" || el == "textarea") return;
	if(event.detail > 1) event.preventDefault();
}, false);

addEventListener("keydown", e => {
	if(!state.play.playing && !state.popeye.playing) return;
	const el = document.activeElement?.nodeName.toLowerCase();
	if(el == "input" || el == "textarea") return;
	const k = e.key;
	if(k == "a" || k == "ArrowLeft") {
		e.preventDefault();
		if(state.play.playing) moveHistory(-1);
		else Popeye.moveBy(-1);
	}
	if(k == "d" || k == "ArrowRight") {
		e.preventDefault();
		if(state.play.playing) moveHistory(1);
		else Popeye.moveBy(1);
	}
});

//===========================================================
// export
//===========================================================

window.share = async function(bt) {
	gtag("event", "fen_img_share");
	if(env.canSharePng) {
		const blob = await getBlob();
		const files = [new File([blob], "board.png", { type: "image/png" })];
		navigator.share({ files });
	} else {
		// Firefox Android fallback mode
		bt.disabled = true;
		const i = bt.querySelector("i");
		const old = i.className;
		i.className = "fa-spin fa-solid fa-spinner";
		try {
			const url = await API.copyUrl();
			navigator.share({
				url,
				// Actually FF Android hasn't implement `text` parameter yet,
				// but it won't hurt adding it either.
				// See https://caniuse.com/mdn-api_navigator_canshare_data_text_parameter
				text: normalForsyth(),
			});
		} finally {
			bt.disabled = false;
			i.className = old;
		}
	}
}

//===========================================================
// petite-vue
//===========================================================

function updateBG() {
	drawEmpty(SN.getContext("2d"));
	redraw();
}

function redraw() {
	draw();
	drawTemplate();
}

async function drawExport() {
	await load();
	draw();
}

createApp({
	env,
	copyImage,
	CheckboxBase,
	Checkbox,
	CheckboxR,
	CopyButton,
	redraw,
	updateBG,
	updateSN,
	openFile,
	Popeye,
	updateEdwards,
	toFEN,
	toggleCoordinates() {
		setOption({}, true);
	},
	get DB() {
		return store.DB.use == "PDB" ? PDB : YACPDB;
	},
	get noEditing() {
		return noEditing();
	},
	get hideTemplate() {
		return status.hor && state.popeye.playing;
	},
	YACPDB,
	BBS,
	API,
	PLAY,
	store,
	state,
	status,
	drawExport,
	resize() {
		state.split;
		Promise.resolve().then(() => setOption({}));
	},
	saveSettings,
	saveSession,
}).mount();
