import { makeOption } from "js/meta/option";
import { inferDimension, parseFEN } from "js/meta/fen";
import { dpr, draw } from "./draw";
import { loadAsset } from "js/view/asset";

import type { Background } from "js/meta/enum";

const param = new URL(location.href).searchParams;
const fen = param.get("fen") || "8/8/8/8/8/8/8/8";

const options = makeOption({
	size: getNumber("size"),
	set: getString("set"),
	knightOffset: getNumber("knightOffset"),
	pattern: getString("pattern"),
	bg: getString<Background>("bg"),
	border: getString("border"),
	blackWhite: param.has("blackWhite"),
	w: getNumber("w"),
	h: getNumber("h"),
});

function getString<T extends string = string>(name: string): T | undefined {
	return param.get(name) as T || undefined;
}

function getNumber(name: string): number | undefined {
	const n = param.get(name);
	return n ? Number(n) : undefined;
}

const { w, h } = inferDimension(fen) || options;
const squares = parseFEN(fen, w, h);
options.w = w;
options.h = h;

loadAsset("../assets", options, dpr).then(() => draw(squares, options));
