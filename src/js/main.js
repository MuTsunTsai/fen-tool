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
// petite-vue
//===========================================================

function updateBG() {
	drawEmpty(SN.getContext("2d"));
	draw();
	drawTemplate();
}

createApp({
	env,
	copyImage,
	CheckboxBase,
	Checkbox,
	CopyButton,
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
}).mount();
