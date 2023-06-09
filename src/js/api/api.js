import { inferDimension, parseFEN } from "../meta/fen.mjs";
import { makeOption } from "../meta/option";
import { dpr, draw } from "./draw.js";
import { loadAsset } from "../asset";

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
	await loadAsset("../assets", options, dpr);
	const CN = draw(squares, options);
	event.ports[0].postMessage(CN.toDataURL());
}
