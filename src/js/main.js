import { createApp } from "petite-vue";
import { store, state, saveSettings } from "./store";
import { setSquareBG, updateSN } from "./squares";
import { drawTemplate, draw, getBlob } from "./render";
import { initLayout } from "./layout";
import { initDrag } from "./drag";
import { YACPDB, PDB, BBS, API } from "./tools";
import { Checkbox, CheckboxBase } from "./checkbox";
import { CopyButton, copyImage } from "./copy";
import { env } from "./meta/env";

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
	setSquareBG();
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
