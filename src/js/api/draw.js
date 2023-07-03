import { drawBoard } from "../draw";
import { parseBorder } from "../meta/option";

const CN = document.getElementById("CN");
const ctx = CN.getContext("2d");

export const dpr = Math.min(2, Math.floor(devicePixelRatio));

export function draw(squares, options) {
	const border = parseBorder(options.border);
	const w = options.w * options.size + 2 * border.size;
	const h = options.h * options.size + 2 * border.size;
	CN.width = w * dpr;
	CN.height = h * dpr;
	CN.style.width = w + "px";
	CN.style.height = h + "px";
	drawBoard(ctx, squares, options, dpr);
	return CN;
}
