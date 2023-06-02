import { background, drawPiece, drawBorder } from "../draw";
import { parseBorder } from "../option";

const CN = document.getElementById("CN");
const ctx = CN.getContext("2d");

export function draw(img, squares, options) {
	const border = parseBorder(options.border);
	const w = 8 * options.size + 2 * border.size;
	const h = 8 * options.size + 2 * border.size;
	CN.width = w;
	CN.height = h;
	drawBorder(ctx, border, w, h);
	ctx.save();
	ctx.translate(border.size, border.size);
	ctx.font = `${options.size - 4}px arial`;
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const bg = background(options.pattern, i, j);
			drawPiece(ctx, img, i, j, squares[i * 8 + j], bg, options);
		}
	}
	ctx.restore();
	return CN;
}
