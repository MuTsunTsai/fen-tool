import { ONE_EMOJI, convertSN } from "./meta/fen.mjs";
import { parseBorder } from "./meta/option";
import { getAsset } from "./asset";

export const types = ["k", "q", "b", "n", "r", "p", "c", "x", "s", "t", "a", "d"];

const pieces = document.createElement("canvas");
const pieceCtx = pieces.getContext("2d");
const mask = document.createElement("canvas");
const maskCtx = mask.getContext("2d");

const maskAlpha = {
	26: "YdVh1QDVYdVh",
	32: "AAAKAAAAo/+jAAr/AP8KAKP/owAAAAoAAA==",
	38: "AAw+DAAM3P/cDD7/AP8+DNz/3AwADD4MAA==",
	44: "AC9yLwAv+f/5L3L/AP9yL/n/+S8AL3IvAA==",
	52: "A3i2eAN4////eLb/AP+2eP///3gDeLZ4Aw==",
	64: "AAAEHgQAAAA/5v/mPwAE5v///+YEHv//AP//HgTm////5gQAP+b/5j8AAAAEHgQAAA==",
	76: "AARZhFkEAAS7////uwRZ//////9ZhP//AP//hFn//////1kEu////7sEAARZhFkEAA==",
	88: "AEfE68RHAEf8/////EfE///////E6///AP//68T//////8RH/P////xHAEfE68RHAA==",
};

export function drawBoard(ctx, squares, options, dpr, ghost) {
	const border = parseBorder(options.border);
	const assets = getAsset(options, dpr);
	const w = options.w * options.size + 2 * border.size;
	const h = options.h * options.size + 2 * border.size;
	ctx.canvas.width = w * dpr;
	ctx.canvas.height = h * dpr;
	ctx.save();
	ctx.scale(dpr, dpr);
	const classic = options.bg == "classic";
	const transparent = ghost || classic;
	ctx.translate(border.size, border.size);
	for(let i = 0; i < options.h; i++) {
		for(let j = 0; j < options.w; j++) {
			if(!transparent) drawBlank(ctx, i, j, options);
			drawPiece(ctx, assets, i, j, squares[i * options.w + j], options, dpr);
		}
	}
	ctx.restore();
	if(classic && !ghost) {
		createGlow(ctx, options.size, dpr);
		ctx.save();
		ctx.scale(dpr, dpr);
		ctx.translate(border.size, border.size);
		for(let i = 0; i < options.h; i++) {
			for(let j = 0; j < options.w; j++) {
				drawBlank(ctx, i, j, options);
			}
		}
		ctx.restore();
		ctx.drawImage(mask, 0, 0); // Repeat 3 times to increase masking
		ctx.drawImage(mask, 0, 0);
		ctx.drawImage(mask, 0, 0);
		ctx.drawImage(pieces, 0, 0);
	}
	ctx.scale(dpr, dpr);
	if(!ghost) drawBorder(ctx, border, w, h);
}

/**
 * The core drawing method.
 */
function drawPiece(ctx, assets, i, j, value, options, dpr) {
	const { size } = options;
	const neutral = value.startsWith("-");
	if(neutral) value = value.substring(1);

	const match = value.match(/^\*(\d)/);
	let rotate = match && match[1] || undefined;
	if(rotate !== undefined) value = value.substring(2);
	rotate = Number(rotate) % 4;

	if(options.SN) value = convertSN(value, false, true);
	const lower = value.toLowerCase();
	const typeIndex = types.indexOf(lower);
	const isText = value.startsWith("'");
	if(typeIndex < 0 && !isText) return;

	ctx.save();
	const bw = options.blackWhite;
	const sx = neutral ? (bw ? 0 : 2) : value == lower ? 0 : 1;
	const f = neutral && bw ? (lower == "n" ? options.knightOffset : .5) : 1;
	const [rx, ry] = [(rotate + 1 & 2) ? 1 : 0, rotate & 2 ? 1 : 0];
	ctx.translate((j + rx) * size, (i + ry) * size);
	if(rotate !== 0) ctx.rotate(Math.PI / 2 * rotate);
	if(isText) {
		const text = value.substring(value.startsWith("''") ? 2 : 1);
		drawText(ctx, text, size);
	} else {
		ctx.drawImage(assets, sx * size * dpr, typeIndex * size * dpr, size * f * dpr, size * dpr, 0, 0, size * f, size);
		if(neutral && bw) {
			ctx.drawImage(assets, (1 + f) * size * dpr, typeIndex * size * dpr, size * (1 - f) * dpr, size * dpr, size * f, 0, size * (1 - f), size);
		}
	}
	ctx.restore();
}

function background(pattern, i, j) {
	if(pattern == "mono") return 1;
	let bg = (i + j) % 2;
	if(pattern != "inverted") bg = 1 - bg;
	return bg;
}

function drawBorder(ctx, border, w, h) {
	ctx.save();
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

function createGlow(ctx, size, dpr) {
	const cn = ctx.canvas;
	mask.width = pieces.width = cn.width;
	mask.height = pieces.height = cn.height;
	pieceCtx.drawImage(cn, 0, 0);

	ctx.save();
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, cn.width, cn.height);
	ctx.globalCompositeOperation = "destination-in";
	ctx.drawImage(pieces, 0, 0);
	ctx.restore();

	ctx.save();
	const alphaData = getMask(size * dpr);
	const bound = Math.sqrt(alphaData.length);
	const offset = (bound - 1) / 2;
	for(let x = 0; x < bound; x++) {
		for(let y = 0; y < bound; y++) {
			const alpha = alphaData[y * bound + x];
			if(alpha == 0) continue;
			ctx.globalAlpha = alpha / 255;
			maskCtx.drawImage(cn, x - offset, y - offset);
		}
	}
	ctx.restore();
}

function getMask(id) {
	if(typeof maskAlpha[id] == "string") {
		const binary = atob(maskAlpha[id]);
		const result = [];
		for(let i = 0; i < binary.length; i++) result.push(binary.charCodeAt(i));
		maskAlpha[id] = result;
	}
	return maskAlpha[id];
}

function drawBlank(ctx, i, j, options) {
	const light = background(options.pattern, i, j);
	const size = options.size;
	ctx.save();
	ctx.translate(j * size, i * size);
	if(options.bg == "classic") {
		ctx.strokeStyle = "black";
		ctx.lineWidth = size / 60;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, size, size);
		if(!light) {
			ctx.beginPath();
			const step = size / 7.5;
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
	} else {
		ctx.fillStyle = getBgColor(light, options.bg);
		ctx.fillRect(0, 0, size, size);
	}
	ctx.restore();
}

function getBgColor(light, bg) {
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

function getHeight(measure) {
	return measure.actualBoundingBoxAscent - measure.actualBoundingBoxDescent;
}

function drawText(ctx, text, size) {
	ctx.save();
	const isEmoji = ONE_EMOJI.test(text);
	const font = size - 4;
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