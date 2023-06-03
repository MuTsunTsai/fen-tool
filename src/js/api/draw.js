import { background, drawPiece, drawBorder } from "../draw";
import { parseBorder } from "../option";

const CN = document.getElementById("CN");
const ctx = CN.getContext("2d");

export function draw(img, squares, options) {
	const border = parseBorder(options.border);
	const w = options.w * options.size + 2 * border.size;
	const h = options.h * options.size + 2 * border.size;
	CN.width = w;
	CN.height = h;
	drawBorder(ctx, border, w, h);
	ctx.save();
	ctx.translate(border.size, border.size);
	ctx.font = `${options.size - 4}px arial`;
	for(let i = 0; i < options.h; i++) {
		for(let j = 0; j < options.w; j++) {
			const bg = background(options.pattern, i, j);
			drawPiece(ctx, img, i, j, squares[i * options.w + j], bg, options);
		}
	}
	ctx.restore();
	return CN;
}
