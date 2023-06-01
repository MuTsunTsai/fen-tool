import { makeOption } from "../option";
import { parseFEN } from "../fen.mjs";
import { draw } from "./draw";

const url = new URL(location.href);
const squares = parseFEN(url.searchParams.get("fen") || "8/8/8/8/8/8/8/8");

const options = makeOption({
	size: url.searchParams.get("size"),
	set: url.searchParams.get("set"),
	knightOffset: url.searchParams.get("knightOffset"),
	uncolored: url.searchParams.has("uncolored"),
	inverted: url.searchParams.has("inverted"),
	grayBG: url.searchParams.has("grayBG"),
	blackWhite: url.searchParams.has("blackWhite"),
})

const img = new Image();
img.onload = () => draw(img, squares, options);
img.src = `../assets/${options.set}${options.size}.png`;
