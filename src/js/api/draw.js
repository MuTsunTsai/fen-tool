import { drawBoard } from "../draw";
import { parseBorder } from "../meta/option";

const CN = document.getElementById("CN");
const ctx = CN.getContext("2d");

export function draw(img, squares, options) {
	const border = parseBorder(options.border);
	const w = options.w * options.size + 2 * border.size;
	const h = options.h * options.size + 2 * border.size;
	CN.width = w;
	CN.height = h;
	drawBoard(ctx, img, squares, options);
	return CN;
}
