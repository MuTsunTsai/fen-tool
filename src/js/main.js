import { createApp } from "petite-vue";
import { store, state, saveSettings } from "./store";
import { updateSN } from "./squares";
import { drawTemplate, draw, getBlob, drawEmpty, load } from "./render";
import { initLayout, setOption } from "./layout";
import { initDrag } from "./drag";
import { YACPDB, PDB, BBS, API } from "./tools";
import { Checkbox, CheckboxBase } from "./checkbox";
import { CopyButton, copyImage } from "./copy";
import { env } from "./meta/env";
import { SN } from "./meta/el";
import { normalFEN } from "./tools/api";
import { PLAY } from "./tools/play";

initLayout();
initDrag();

// https://stackoverflow.com/a/43321596/9953396
document.addEventListener('mousedown', function(event) {
	if(event.detail > 1) event.preventDefault();
}, false);

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
				text: normalFEN(),
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
	CopyButton,
	redraw,
	updateBG,
	updateSN,
	get DB() {
		return store.DB.use == "PDB" ? PDB : YACPDB;
	},
	YACPDB,
	BBS,
	API,
	PLAY,
	store,
	state,
	tab: 0,
	drawExport,
	resize() {
		state.split;
		Promise.resolve().then(() => setOption({}));
	},
	saveSettings,
}).mount();
