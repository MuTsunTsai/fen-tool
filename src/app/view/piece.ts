import { convertSN, ONE_EMOJI } from "app/meta/fen";
import { Rotation } from "app/meta/enum";

import type { BoardOptions } from "app/meta/option";
import type { DrawContext } from "./utils";

const DEFAULT_KNIGHT_OFFSET = 0.5;
const TEXT_PADDING = 4;

export const types = ["k", "q", "b", "n", "r", "p", "c", "x", "s", "t", "a", "d"];

/**
 * The core drawing method.
 */
export function drawPiece(
	ctx: CanvasRenderingContext2D,
	i: number, j: number, raw: string,
	{ assets, options, dpr }: DrawContext
): void {
	const context = parsePiece(raw, options);
	if(!context) return;
	const { neutral, rotate, isText, value, lower, typeIndex } = context;

	ctx.save();
	const bw = options.blackWhite;
	const sx = getShiftX(context, bw);
	const f = getFraction(neutral, lower, bw, options);
	const [rx, ry] = [rotate + 1 & 2 ? 1 : 0, rotate & 2 ? 1 : 0];
	const { size } = options;
	ctx.translate((j + rx) * size, (i + ry) * size);
	if(rotate !== 0) ctx.rotate(Math.PI / 2 * rotate);
	if(isText) {
		const text = value.substring(value.startsWith("''") ? 2 : 1);
		drawText(ctx, text, size);
	} else {
		ctx.drawImage(
			assets,
			sx * size * dpr, typeIndex * size * dpr, size * f * dpr, size * dpr,
			0, 0, size * f, size
		);
		if(neutral && bw) {
			ctx.drawImage(
				assets,
				(1 + f) * size * dpr, typeIndex * size * dpr, size * (1 - f) * dpr, size * dpr,
				size * f, 0, size * (1 - f), size
			);
		}
	}
	ctx.restore();
}

interface PieceContext {
	neutral: boolean;
	rotate: number;
	isText: boolean;
	value: string;
	lower: string;
	typeIndex: number;
}

function parsePiece(value: string | undefined, options: BoardOptions): PieceContext | null {
	if(value === undefined) value = "";

	const neutral = Boolean(value) && value.startsWith("-");
	if(neutral) value = value.substring(1);

	const match = value.match(/^\*(\d)/);
	let rotate = match && match[1] ? Number(match[1]) : undefined;
	if(rotate !== undefined) value = value.substring(2);
	rotate = Number(rotate) % Rotation.full;

	if(options.SN) value = convertSN(value, false, true);
	const lower = value.toLowerCase();
	const typeIndex = types.indexOf(lower);
	const isText = value.startsWith("'");
	if(typeIndex < 0 && !isText) return null;

	return { neutral, rotate, isText, value, lower, typeIndex };
}

function getShiftX(context: PieceContext, bw: boolean): number {
	const { neutral, value, lower } = context;
	if(neutral) return bw ? 0 : 2;
	else return value == lower ? 0 : 1;
}

function getFraction(neutral: boolean, lower: string, bw: boolean, options: BoardOptions): number {
	if(!neutral || !bw) return 1;
	return lower == "n" ? options.knightOffset : DEFAULT_KNIGHT_OFFSET;
}

function getHeight(measure: TextMetrics): number {
	return measure.actualBoundingBoxAscent - measure.actualBoundingBoxDescent;
}

function drawText(ctx: CanvasRenderingContext2D, text: string, size: number): void {
	ctx.save();
	const isEmoji = ONE_EMOJI.test(text);
	const font = size - TEXT_PADDING;
	ctx.font = `${font}px sans-serif`;

	const max = size - 2;
	let measure = ctx.measureText(text);
	if(isEmoji && measure.width > max) { // Fix emoji distortion
		const f = max / measure.width;
		ctx.font = `${font * f}px sans-serif`;
		measure = ctx.measureText(text);
	}

	// MacOS and Linux might measure the height of emoji correctly,
	// so we measure the height of "M" instead.
	// This code is in fact safe to use in general.
	const height = getHeight(isEmoji ? ctx.measureText("M") : measure);
	const dx = (size - Math.min(measure.width, max)) / 2;
	const dy = Math.max((size - height) / 2, 0);

	ctx.fillStyle = "black";
	ctx.fillText(text, dx, size - dy, max);

	ctx.restore();
}

