import { drawBoard } from "app/view/draw";
import { getDimensions } from "app/meta/option";

import type { BoardOptions } from "app/meta/option";

const CN = document.getElementById("CN") as HTMLCanvasElement;
const ctx = CN.getContext("2d")!;

export const dpr = Math.min(2, Math.floor(devicePixelRatio));

export function draw(squares: string[], options: BoardOptions): HTMLCanvasElement {
	const { w, h } = getDimensions(options);
	CN.width = w * dpr;
	CN.height = h * dpr;
	CN.style.width = w + "px";
	CN.style.height = h + "px";
	drawBoard(ctx, squares, options, dpr);
	return CN;
}
