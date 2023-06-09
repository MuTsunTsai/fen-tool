import { store } from "../store";
import { CN, FEN } from "../meta/el";
import { parseBorder } from "../meta/option";
import { inferDimension, makeFEN } from "../meta/fen.mjs";
import { normalSnapshot } from "../squares";

function getURL(url) {
	return new URL(url, location.href).toString();
}

export function normalFEN() {
	const { SN, w, h } = store.board;
	if(SN) {
		return makeFEN(normalSnapshot(), w, h);
	} else {
		return FEN.value;
	}
}

function getEmbedUrl() {
	const options = store.board;
	const fen = normalFEN();
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
		return "https://www.janko.at/Retros/d.php?ff=" + normalFEN();
	},
	copyBase64() {
		gtag("event", "fen_link_copy64");
		return CN.toDataURL();
	},
	copyBase64Img() {
		gtag("event", "fen_link_copy64img");
		return `<img fen="${CN.toDataURL()}">`;
	},
	async copyUrl() {
		gtag("event", "fen_gen_link");
		// This feature uses https://freeimage.host public API
		const data = new URLSearchParams();
		data.append("key", "6d207e02198a847aa98d0a2a901485a5"); // This appears to be a public key
		data.append("action", "upload");
		data.append("source", CN.toDataURL().replace(/^.+base64,/, ""));
		data.append("format", "txt");
		try {
			const response = await fetch("https://corsproxy.io/?https://freeimage.host/api/1/upload", {
				method: "post",
				body: data,
			});
			return await response.text();
		} catch(e) {
			alert("Internet connection failed. Please try again later.");
			throw e;
		}
	},
	copyEmbed() {
		gtag("event", "fen_copy_embed");
		const options = store.board;
		let url = getEmbedUrl();
		const borderSize = parseBorder(options.border).size;
		const w = options.size * options.w + 2 * borderSize;
		const h = options.size * options.h + 2 * borderSize;
		return `<iframe src="${url}" style="border:none;width:${w}px;height:${h}px"></iframe>`;
	},
	copyEmbedUrl() {
		gtag("event", "fen_copy_embedUrl");
		return getEmbedUrl();
	},
	copyImg() {
		gtag("event", "fen_copy_sdkImg");
		return `<img fen="${normalFEN()}">`;
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
