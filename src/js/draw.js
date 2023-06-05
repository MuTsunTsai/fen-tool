import { fullWidth } from "./meta/fullWidth";

export const types = ["k", "q", "b", "n", "r", "p", "c", "x"];

/**
 * The core drawing method.
 * @param {*} bg dark=0, light=1, transparent=2
 */
export function drawPiece(ctx, img, i, j, value, bg, options) {
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

	const gray = options.bg == "gray";
	if((typeIndex < 0 || gray) && bg != 2) drawBlank(ctx, i, j, bg, options);
	if(typeIndex < 0 && !isText) return;

	ctx.save();
	if(gray) bg = 2;
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

function drawBlank(ctx, i, j, light, options) {
	const size = options.size;
	ctx.save();
	if(options.bg == "gray") {
		ctx.fillStyle = light ? "#fff" : "#bbb";
	} else {
		ctx.fillStyle = light ? "#FFCE9E" : "#D18B47";
	}
	ctx.fillRect(j * size, i * size, size, size);
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