import { store } from "../store";
import { CN, FEN } from "../el";
import { parseBorder } from "../option";
import { inferDimension } from "../fen.mjs";

function getURL(url) {
	return new URL(url, location.href).toString();
}

export const API = {
	copyBase64() {
		gtag("event", "fen_link_copy64");
		return CN.toDataURL();
	},
	copyBase64Img() {
		gtag("event", "fen_link_copy64img");
		return `<img fen="${CN.toDataURL()}">`;
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
		if(!inferDimension(FEN.value)) url += `&w=${options.w}&h=${options.h}`;
		const borderSize = parseBorder(options.border).size;
		const w = options.size * options.w + 2 * borderSize;
		const h = options.size * options.h + 2 * borderSize;
		return `<iframe src="${url}" style="border:none;width:${w}px;height:${h}px"></iframe>`;
	},
	copyImg() {
		return `<img fen="${FEN.value}">`;
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
		return `<script src="${getURL("sdk.js")}"${data}></script>`;
	},
};
