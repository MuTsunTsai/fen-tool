import { createApp } from "petite-vue";
import { store, state, saveSettings } from "./store";
import { updateSN } from "./squares";
import { drawTemplate, draw, getBlob, drawEmpty } from "./render";
import { initLayout } from "./layout";
import { initDrag } from "./drag";
import { YACPDB, PDB, BBS, API } from "./tools";
import { Checkbox, CheckboxBase } from "./checkbox";
import { CopyButton, copyImage } from "./copy";
import { env } from "./meta/env";
import { SN } from "./meta/el";
import { getNormalFEN } from "./tools/api";

initLayout();
initDrag();

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
				text: getNormalFEN(),
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
	store,
	state,
	tab: 0,
	saveSettings,
}).mount();
