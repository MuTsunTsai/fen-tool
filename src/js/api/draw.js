import { drawPiece } from "../draw";

const CN = document.getElementById("CN");
const ctx = CN.getContext("2d");

export function draw(img, squares, options) {
	const full = 8 * options.size + 2;
	CN.width = CN.height = full;
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, full, full);
	ctx.font = `${options.size - 4}px arial`;
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const bg = options.uncolored || options.inverted == Boolean((i + j) % 2) ? 1 : 0;
			drawPiece(ctx, img, i, j, squares[i * 8 + j], bg, options);
		}
	}
	return CN;
}
