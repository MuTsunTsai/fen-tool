import { inferDimension, parseFEN } from "../meta/fen.mjs";
import { makeOption } from "../meta/option";
import { draw } from "./draw.js";
import { loadAsset } from "../asset";

const imgs = new Map();

function load(options) {
	const key = options.set + options.size;
	if(imgs.has(key)) return imgs.get(key);
	else {
		const promise = new Promise(async resolve => {
			const img = new Image();
			const assets = await loadAsset("../assets", options);
			img.onload = () => resolve(img);
			img.src = assets.toDataURL();
		});
		imgs.set(key, promise);
		return promise;
	}
}

parent.postMessage(null, "*"); // Signal ready

onmessage = async event => {
	if(event.source != parent || !event.ports[0]) return;
	gtag("event", "fen_sdk_gen")

	const options = makeOption(event.data.options);
	const fen = event.data.fen || "8/8/8/8/8/8/8/8";
	const { w, h } = inferDimension(fen) || options;
	const squares = parseFEN(fen, w, h);
	options.w = w;
	options.h = h;
	const img = await load(options);
	const CN = draw(img, squares, options);
	event.ports[0].postMessage(CN.toDataURL());
}
