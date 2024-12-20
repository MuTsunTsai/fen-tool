import { createCanvasAndCtx } from "./utils";

import type { DrawContext } from "./utils";

const FULL_ALPHA = 255;
const CLASSIC_STEPS = 7.5;
const CLASSIC_WIDTH_FACTOR = 60;

const maskAlphaRaw = {
	26: "YdVh1QDVYdVh",
	32: "AAAKAAAAo/+jAAr/AP8KAKP/owAAAAoAAA==",
	38: "AAw+DAAM3P/cDD7/AP8+DNz/3AwADD4MAA==",
	44: "AC9yLwAv+f/5L3L/AP9yL/n/+S8AL3IvAA==",
	52: "A3i2eAN4////eLb/AP+2eP///3gDeLZ4Aw==",
	64: "AAAEHgQAAAA/5v/mPwAE5v///+YEHv//AP//HgTm////5gQAP+b/5j8AAAAEHgQAAA==",
	76: "AARZhFkEAAS7////uwRZ//////9ZhP//AP//hFn//////1kEu////7sEAARZhFkEAA==",
	88: "AEfE68RHAEf8/////EfE///////E6///AP//68T//////8RH/P////xHAEfE68RHAA==",
} as Record<number, string>;
const maskAlpha = {} as Record<number, number[]>;

const [mask, maskCtx] = createCanvasAndCtx();
const [glow, glowCtx] = createCanvasAndCtx();

export function drawGlow(ctx: CanvasRenderingContext2D, pieces: HTMLCanvasElement, context: DrawContext): void {
	const { dpr, options } = context;
	createGlow(pieces, options.size, dpr);

	// Repeat 3 times to increase masking
	ctx.drawImage(glow, 0, 0);
	ctx.drawImage(glow, 0, 0);
	ctx.drawImage(glow, 0, 0);
}

export function drawClassic(ctx: CanvasRenderingContext2D, size: number, light: number): void {
	ctx.strokeStyle = "black";
	ctx.lineWidth = size / CLASSIC_WIDTH_FACTOR;
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, size, size);
	if(light) return;

	ctx.beginPath();
	const step = size / CLASSIC_STEPS;
	for(let i = 0; i < size; i += step) {
		ctx.moveTo(size - i, 0);
		ctx.lineTo(0, size - i);
		if(i > 0) {
			ctx.moveTo(i, size);
			ctx.lineTo(size, i);
		}
	}
	ctx.stroke();
}

function createGlow(pieces: HTMLCanvasElement, size: number, dpr: number): void {
	glow.width = mask.width = pieces.width;
	glow.height = mask.height = pieces.height;

	maskCtx.fillStyle = "white";
	maskCtx.fillRect(0, 0, pieces.width, pieces.height);
	maskCtx.globalCompositeOperation = "destination-in";
	maskCtx.drawImage(pieces, 0, 0);

	const alphaData = getMask(size * dpr);
	const bound = Math.sqrt(alphaData.length);
	const offset = (bound - 1) / 2;
	for(let x = 0; x < bound; x++) {
		for(let y = 0; y < bound; y++) {
			const alpha = alphaData[y * bound + x];
			if(alpha == 0) continue;
			maskCtx.globalAlpha = alpha / FULL_ALPHA;
			glowCtx.drawImage(mask, x - offset, y - offset);
		}
	}
}

function getMask(id: number): number[] {
	if(!(id in maskAlpha)) {
		const binary = atob(maskAlphaRaw[id]);
		const result = [];
		for(let i = 0; i < binary.length; i++) result.push(binary.charCodeAt(i));
		maskAlpha[id] = result;
	}
	return maskAlpha[id];
}
