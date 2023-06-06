import { fullWidth } from "./meta/fullWidth";
import { parseBorder } from "./meta/option";

export const types = ["k", "q", "b", "n", "r", "p", "c", "x"];

const pieces = document.createElement("canvas");
const pieceCtx = pieces.getContext("2d");
const mask = document.createElement("canvas");
const maskCtx = mask.getContext("2d");

const maskAlpha = {
	26: [0, 0, 0, 0, 0, 0, 97, 213, 97, 0, 0, 213, 255, 213, 0, 0, 97, 213, 97, 0, 0, 0, 0, 0, 0],
	32: [0, 0, 10, 0, 0, 0, 163, 255, 163, 0, 10, 255, 255, 255, 10, 0, 163, 255, 163, 0, 0, 0, 10, 0, 0],
	38: [0, 12, 62, 12, 0, 12, 220, 255, 220, 12, 62, 255, 255, 255, 62, 12, 220, 255, 220, 12, 0, 12, 62, 12, 0],
	44: [0, 47, 114, 47, 0, 47, 249, 255, 249, 47, 114, 255, 255, 255, 114, 47, 249, 255, 249, 47, 0, 47, 114, 47, 0]
}

export function drawBoard(ctx, img, squares, options, ghost) {
	const border = parseBorder(options.border);
	const w = options.w * options.size + 2 * border.size;
	const h = options.h * options.size + 2 * border.size;
	ctx.canvas.width = w;
	ctx.canvas.height = h;
	const classic = options.bg == "classic";
	const transparent = ghost || classic;
	if(transparent) ctx.clearRect(0, 0, w, h);
	ctx.save();
	ctx.translate(border.size, border.size);
	for(let i = 0; i < options.h; i++) {
		for(let j = 0; j < options.w; j++) {
			const bg = transparent ? 2 : background(options.pattern, i, j);
			drawPiece(ctx, img, i, j, squares[i * options.w + j], bg, options);
		}
	}
	ctx.restore();
	if(classic && !ghost) {
		createGlow(ctx, options.size);
		ctx.save();
		ctx.translate(border.size, border.size);
		for(let i = 0; i < options.h; i++) {
			for(let j = 0; j < options.w; j++) {
				const bg = background(options.pattern, i, j);
				drawBlank(ctx, i, j, bg, options);
			}
		}
		ctx.restore();
		ctx.drawImage(mask, 0, 0);
		ctx.drawImage(mask, 0, 0);
		ctx.drawImage(mask, 0, 0);
		ctx.drawImage(pieces, 0, 0);
	}
	if(!ghost) drawBorder(ctx, border, w, h);
}

/**
 * The core drawing method.
 * @param {*} bg dark=0, light=1, transparent=2
 */
function drawPiece(ctx, img, i, j, value, bg, options) {
	const size = options.size;
	const neutral = value.startsWith("-");
	if(neutral) value = value.substring(1);

	const match = value.match(/^\*(\d)/);
	let rotate = match && match[1] || undefined;
	if(rotate !== undefined) value = value.substring(2);
	rotate = Number(rotate) % 4;

	if(value == "s") value = "n";
	if(value == "S") value = "N";
	const lower = value.toLowerCase();
	const typeIndex = types.indexOf(lower);
	const isText = value.startsWith("'");

	const notDefault = options.bg !== undefined;
	if((typeIndex < 0 || notDefault) && bg != 2) drawBlank(ctx, i, j, bg, options);
	if(typeIndex < 0 && !isText) return;

	ctx.save();
	if(notDefault) bg = 2;
	const bw = options.blackWhite;
	const sx = neutral ? (bw ? 0 : 2) : value == lower ? 0 : 1;
	const f = neutral && bw ? (lower == "n" ? options.knightOffset : .5) : 1;
	const [rx, ry] = [(rotate + 1 & 2) ? 1 : 0, rotate & 2 ? 1 : 0];
	ctx.translate((j + rx) * size, (i + ry) * size);
	if(rotate !== 0) ctx.rotate(Math.PI / 2 * rotate);
	if(isText) {
		const c = value.substring(1);
		const text = value.startsWith("''") ? value.substring(2) : fullWidth(c, false) || c;
		drawText(ctx, text, size);
	} else {
		ctx.drawImage(img, (sx + bg * 3) * size, typeIndex * size, size * f, size, 0, 0, size * f, size);
		if(neutral && bw) {
			ctx.drawImage(img, (1 + f + bg * 3) * size, typeIndex * size, size * (1 - f), size, size * f, 0, size * (1 - f), size);
		}
	}
	ctx.restore();
}

export function background(pattern, i, j) {
	if(pattern == "mono") return 1;
	let bg = (i + j) % 2;
	if(pattern != "inverted") bg = 1 - bg;
	return bg;
}

export function drawBorder(ctx, border, w, h) {
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

function createGlow(ctx, size) {
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
	for(let x = 0; x < 5; x++) {
		for(let y = 0; y < 5; y++) {
			const alpha = maskAlpha[size][y * 5 + x];
			if(alpha == 0) continue;
			ctx.globalAlpha = alpha / 255;
			maskCtx.drawImage(cn, x - 2, y - 2);
		}
	}
	ctx.restore();
}

function drawBlank(ctx, i, j, light, options) {
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
			const step = size / 8;
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
		if(options.bg == "gray") {
			ctx.fillStyle = light ? "#fff" : "#bbb";
		} else if(options.bg == "green") {
			ctx.fillStyle = light ? "#EEEED2" : "#769656";
		} else {
			ctx.fillStyle = light ? "#FFCE9E" : "#D18B47";
		}
		ctx.fillRect(0, 0, size, size);
	}
	ctx.restore();
}

function drawText(ctx, text, size) {
	ctx.save();
	const isEmoji = /\p{Extended_Pictographic}/u.test(text); // Emoji, but exclude numbers
	const font = size - 4;
	ctx.font = `${font}px arial`;

	const max = size - 2;
	let measure = ctx.measureText(text);
	if(isEmoji && measure.width > max) { // Fix emoji distortion
		const f = max / measure.width;
		ctx.font = `${font * f}px arial`;
		measure = ctx.measureText(text);
	}

	const height = measure.actualBoundingBoxAscent - measure.actualBoundingBoxDescent;
	const dx = (size - Math.min(measure.width, max)) / 2;
	const dy = Math.max((size - height) / 2, 0);

	ctx.fillStyle = "black";
	ctx.fillText(text, dx, size - dy, max);

	ctx.restore();
}