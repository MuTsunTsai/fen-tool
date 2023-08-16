import { store } from "../store";
import { FEN } from "../meta/el";
import { CE } from "../render";
import { getDimensions } from "../meta/option";
import { inferDimension, makeForsyth } from "../meta/fen.mjs";
import { normalSnapshot } from "../squares";

function getURL(url) {
	return new URL(url, location.href).toString();
}

export function normalForsyth() {
	const { SN, w, h } = store.board;
	if(SN) {
		return makeForsyth(normalSnapshot(), w, h);
	} else {
		return FEN.value;
	}
}

function getEmbedUrl() {
	const options = store.board;
	const fen = normalForsyth();
	let url = getURL("gen/?fen=" + fen);
	if(options.size != 44) url += "&size=" + options.size;
	if(options.set != "1echecs") url += "&set=" + options.set;
	if(options.pattern) url += "&pattern=" + options.pattern;
	if(options.bg) url += "&bg=" + options.bg;
	if(options.border != "1") url += "&border=" + options.border;
	if(options.blackWhite) url += "&blackWhite&knightOffset=" + options.knightOffset;
	if(!inferDimension(fen)) url += `&w=${options.w}&h=${options.h}`;
	return url;
}

export const API = {
	copyJanko() {
		gtag("event", "fen_copy_janko");
		return "https://www.janko.at/Retros/d.php?ff=" + normalForsyth();
	},
	copyBase64() {
		gtag("event", "fen_link_copy64");
		return CE.toDataURL();
	},
	copyBase64Img() {
		gtag("event", "fen_link_copy64img");
		return `<img fen="${CE.toDataURL()}">`;
	},
	async copyUrl() {
		gtag("event", "fen_gen_link");
		// This feature uses https://thumbsnap.com/ API
		const data = new FormData();
		const blob = await new Promise(resolve => CE.toBlob(resolve));
		data.append("key", "00044426a0332194443a7f44d62b1c71");
		data.append("media", blob, "board.png");
		try {
			const response = await fetch("https://thumbsnap.com/api/upload", {
				method: "post",
				body: data,
			});
			const json = await response.json();
			if(!json.success) throw json.error.message;
			return json.data.media + "?fen=" + normalForsyth();
		} catch(e) {
			alert(typeof e == "string" ? e : "Internet connection failed. Please try again later.");
			throw e;
		}
	},
	copyEmbed() {
		gtag("event", "fen_copy_embed");
		const options = store.board;
		let url = getEmbedUrl();
		const { w, h } = getDimensions(options);
		return `<iframe src="${url}" style="border:none;width:${w}px;height:${h}px"></iframe>`;
	},
	copyEmbedUrl() {
		gtag("event", "fen_copy_embedUrl");
		return getEmbedUrl();
	},
	copyImg() {
		gtag("event", "fen_copy_sdkImg");
		return `<img fen="${normalForsyth()}">`;
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
