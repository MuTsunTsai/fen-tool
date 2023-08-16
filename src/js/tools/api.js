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
	/** This is a hidden feature that is activated by code. */
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
	/**
	 * This feature uses imgBB API. Tried a few other providers before:
	 * 1. freeImage.host:\
	 *    Doesn't have CORS headers as of Aug. 2023, and blocks corsproxy soon after I used it.
	 * 2. thumbSnap.com:\
	 *    Image URL redirects to webpage when putting into browsers.\
	 *    Still works fine in most use cases, but the image won't display on desktop Discord directly.
	 */
	async copyUrl() {
		gtag("event", "fen_gen_link");
		const data = new FormData();
		const blob = await new Promise(resolve => CE.toBlob(resolve));
		data.append("key", "7802c5da1788f2315222d44bfba20519");
		data.append("image", blob, "fen");
		try {
			const response = await fetch("https://api.imgbb.com/1/upload", {
				method: "post",
				body: data,
			});
			const json = await response.json();
			if(!json.success) throw json.error.message;
			return json.data.url + "?=" + normalForsyth(); // Adding fen to the URL is desirable in most use cases
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
