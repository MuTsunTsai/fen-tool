import type { BoardOptions, DimensionInfo } from "app/meta/option";

export interface DrawContext {
	info: DimensionInfo;
	assets: CanvasImageSource;
	options: BoardOptions;
	dpr: number;
}

export function createCanvasAndCtx(): [HTMLCanvasElement, CanvasRenderingContext2D] {
	const canvas = document.createElement("canvas");
	return [canvas, canvas.getContext("2d")!];
}
