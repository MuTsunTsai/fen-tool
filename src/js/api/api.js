import { inferDimension, parseFEN } from "../fen.mjs";
import { makeOption } from "../option";
import { draw } from "./draw.js";

const imgs = new Map();

function load(options) {
	const key = options.set + options.size;
	if(imgs.has(key)) return imgs.get(key);
	else {
		const promise = new Promise(resolve => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.src = `../assets/${options.set}${options.size}.png`;
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
