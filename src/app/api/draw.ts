import { drawBoard } from "app/view/draw";
import { getDimensions } from "app/meta/option";
import { dpr } from "app/meta/dpr";

import type { BoardOptions } from "app/meta/option";

const CN = document.getElementById("CN") as HTMLCanvasElement;
const ctx = CN.getContext("2d")!;

export function draw(squares: string[], options: BoardOptions): HTMLCanvasElement {
	const { w, h } = getDimensions(options);
	CN.width = w * dpr;
	CN.height = h * dpr;
	CN.style.width = w + "px";
	CN.style.height = h + "px";
	drawBoard(ctx, squares, options, dpr);
	return CN;
}
