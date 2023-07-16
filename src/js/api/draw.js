import { drawBoard } from "../draw";
import { getDimensions } from "../meta/option";

const CN = document.getElementById("CN");
const ctx = CN.getContext("2d");

export const dpr = Math.min(2, Math.floor(devicePixelRatio));

export function draw(squares, options) {
	const { w, h } = getDimensions(options);
	CN.width = w * dpr;
	CN.height = h * dpr;
	CN.style.width = w + "px";
	CN.style.height = h + "px";
	drawBoard(ctx, squares, options, dpr);
	return CN;
}
