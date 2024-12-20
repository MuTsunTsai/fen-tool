import { getAsset } from "./asset";
import { LABEL_MARGIN, getDimensions } from "app/meta/option";
import { CHAR_A_OFFSET } from "app/meta/constants";
import { createCanvasAndCtx } from "./utils";
import { drawClassic, drawGlow } from "./classic";
import { drawPiece } from "./piece";

import type { DrawContext } from "./utils";
import type { BoardOptions, Border } from "app/meta/option";
import type { Background } from "app/meta/enum";

const MAX_ALPHABET = 26;
const COORDINATE_OFFSET = 5;

const [pieces, pieceCtx] = createCanvasAndCtx();

/**
 * This is the starting point of drawing the board.
 */
export function drawBoard(
	ctx: CanvasRenderingContext2D,
	squares: string[], options: BoardOptions,
	dpr: number, ghost?: boolean, isTemplate?: boolean
): void {
	const info = getDimensions(options, isTemplate);
	const assets = getAsset(options, dpr);
	const context: DrawContext = { info, assets, options, dpr };
	const classic = options.bg == "classic";

	setupContext(ctx, context);
	if(!ghost) drawBackground(ctx, options);
	ctx.restore();

	setupContext(pieceCtx, context);
	drawAllPieces(squares, context);
	pieceCtx.restore();

	if(classic && !ghost) drawGlow(ctx, pieces, context);
	ctx.drawImage(pieces, 0, 0);

	ctx.scale(dpr, dpr);
	const { w, h, offset, border, margin } = info;
	if(isTemplate === undefined && options.coordinates) {
		ctx.save();
		ctx.translate(offset.x, offset.y);
		drawCoordinates(ctx, options, border.size);
		ctx.restore();
	}
	if(!ghost) drawBorder(ctx, border, w, h, margin);
}

function setupContext(ctx: CanvasRenderingContext2D, context: DrawContext): void {
	const { dpr } = context;
	const { w, h, offset } = context.info;
	ctx.canvas.width = w * dpr;
	ctx.canvas.height = h * dpr;
	ctx.save();
	ctx.scale(dpr, dpr);
	ctx.translate(offset.x, offset.y);
}

function drawBackground(ctx: CanvasRenderingContext2D, options: BoardOptions): void {
	const { w, h } = options;
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			drawBlank(ctx, i, j, options);
		}
	}
}

function drawAllPieces(squares: string[], context: DrawContext): void {
	const { w, h } = context.options;
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			drawPiece(pieceCtx, i, j, squares[i * w + j], context);
		}
	}
}

function background(pattern: string | undefined, i: number, j: number): number {
	if(pattern == "mono") return 1;
	let bg = (i + j) % 2;
	if(pattern != "inverted") bg = 1 - bg;
	return bg;
}

function drawBorder(ctx: CanvasRenderingContext2D, border: Border, w: number, h: number, margin: IPoint): void {
	ctx.save();
	ctx.translate(margin.x, 0);
	w -= margin.x;
	h -= margin.y;
	let cursor = 0;
	for(let i = 0; i < border.array.length; i++) {
		const width = border.array[i];
		ctx.strokeStyle = i % 2 ? "white" : "black";
		if(width == 0) continue;
		ctx.lineWidth = width;
		const offset = border.size - cursor - width / 2;
		ctx.strokeRect(offset, offset, w - 2 * offset, h - 2 * offset);
		cursor += width;
	}
	ctx.restore();
}

function drawCoordinates(ctx: CanvasRenderingContext2D, options: BoardOptions, bSize: number): void {
	const { size, w, h } = options;
	ctx.font = "15px sans-serif";
	ctx.strokeStyle = "black";
	ctx.lineWidth = 2;
	ctx.fillStyle = "white";
	ctx.lineJoin = "round";
	for(let i = 0; i < h; i++) {
		const text = (i + 1).toString();
		const measure = ctx.measureText(text);
		const y = size * (h - i) - size / 2 + COORDINATE_OFFSET;
		const x = (LABEL_MARGIN - measure.width) / 2 - LABEL_MARGIN - bSize;
		ctx.strokeText(text, x, y);
		ctx.fillText(text, x, y);
	}
	for(let i = 0; i < w && i < MAX_ALPHABET; i++) {
		const text = String.fromCharCode(CHAR_A_OFFSET + i);
		const measure = ctx.measureText(text);
		const y = size * h + LABEL_MARGIN + bSize - COORDINATE_OFFSET;
		const x = size * i + (size - measure.width) / 2;
		ctx.strokeText(text, x, y);
		ctx.fillText(text, x, y);
	}
}

function drawBlank(ctx: CanvasRenderingContext2D, i: number, j: number, options: BoardOptions): void {
	const light = background(options.pattern, i, j);
	const size = options.size;
	ctx.save();
	ctx.translate(j * size, i * size);
	if(options.bg == "classic") {
		drawClassic(ctx, size, light);
	} else {
		ctx.fillStyle = getBgColor(light, options.bg);
		ctx.fillRect(0, 0, size, size);
	}
	ctx.restore();
}

function getBgColor(light: number, bg: Background | undefined): string {
	if(bg == "classic") {
		return "none";
	} else if(bg == "gray") {
		return light ? "#fff" : "#bbb";
	} else if(bg == "green") {
		return light ? "#EEEED2" : "#769656";
	} else {
		return light ? "#FFCE9E" : "#D18B47";
	}
}

