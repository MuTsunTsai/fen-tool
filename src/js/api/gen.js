import { makeOption } from "../meta/option";
import { inferDimension, parseFEN } from "../meta/fen.mjs";
import { dpr, draw } from "./draw";
import { loadAsset } from "../asset";

const param = new URL(location.href).searchParams;
const fen = param.get("fen") || "8/8/8/8/8/8/8/8";

const options = makeOption({
	size: param.get("size"),
	set: param.get("set"),
	knightOffset: param.get("knightOffset"),
	pattern: param.get("pattern"),
	bg: param.get("bg"),
	border: param.get("border"),
	blackWhite: param.has("blackWhite"),
	w: param.get("w"),
	h: param.get("h"),
});

const { w, h } = inferDimension(fen) || options;
const squares = parseFEN(fen, w, h);
options.w = w;
options.h = h;

loadAsset("../assets", options, dpr).then(() => draw(squares, options));