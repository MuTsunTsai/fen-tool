import { CN, CG, TP, TPG } from "./el";
import { fullWidth } from "./bbs";
import { mode } from "./layout";
import { store, state } from "./store";
import { squares } from "./squares";

const img = new Image();
img.onload = () => {
	state.loading = false;
	drawTemplate();
};

if(location.protocol == "https:") img.crossOrigin = "anonymous";
else document.getElementById("B64").disabled = true;

export function load(s) {
	store.board.set = s;
	state.loading = true;
	img.src = TPG.src = `assets/${store.board.set}${store.board.size}.png`;
}
window.load = load;

const ctx = CN.getContext("2d");
const gCtx = CG.getContext("2d");

const types = ["k", "q", "b", "n", "r", "p", "c", "x"];

export function setFont(font) {
	ctx.font = gCtx.font = font;
}

export function drawTemplate() {
	const size = store.board.size;
	const tCtx = TP.getContext("2d");
	const gCtx = TPG.getContext("2d");
	let w = 3 * size + 2, h = 8 * size + 2;
	if(mode.hor) [w, h] = [h, w];
	tCtx.fillStyle = "black";
	tCtx.fillRect(0, 0, w, h);
	gCtx.clearRect(0, 0, w, h);
	const gray = store.board.grayBG;
	for(let i = 0; i < 3; i++) {
		for(let j = 0; j < 8; j++) {
			const sx = gray ? 6 : (i + j) % 2 ? 0 : 3;
			const bw = store.board.blackWhite && i == 2;
			const f = bw ? (j == 3 ? store.board.knightOffset : .5) : 1;
			const x = bw ? 0 : i;
			if(gray) {
				tCtx.fillStyle = (i + j) % 2 ? "#bbb" : "#fff";
				tCtx.fillRect((mode.hor ? j : i) * size + 1, (mode.hor ? i : j) * size + 1, size, size);
			}
			tCtx.drawImage(img, (x + sx) * size, j * size, size * f, size,
				(mode.hor ? j : i) * size + 1, (mode.hor ? i : j) * size + 1, size * f, size);
			gCtx.drawImage(img, (x + 6) * size, j * size, size * f, size,
				(mode.hor ? j : i) * size, (mode.hor ? i : j) * size, size * f, size);
			if(bw) {
				tCtx.drawImage(img, (1 + f + sx) * size, j * size, size * (1 - f), size,
					(f + (mode.hor ? j : i)) * size + 1, (mode.hor ? i : j) * size + 1, size * (1 - f), size);
				gCtx.drawImage(img, (7 + f) * size, j * size, size * (1 - f), size,
					(f + (mode.hor ? j : i)) * size, (mode.hor ? i : j) * size, size * (1 - f), size);
			}
		}
	}
	draw();
}

export async function draw() {
	const full = 8 * store.board.size + 2;
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, full, full);
	if(!mode.dragging) gCtx.clearRect(0, 0, full, full);
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const light = store.board.uncolored || store.board.inverted == Boolean((i + j) % 2);
			const value = squares[i * 8 + j].value;
			drawBlank(i, j, light);
			drawPiece(i, j, value, light);
		}
	}
	if(location.protocol == "https:") {
		const a = document.getElementById("Save");
		if(a.href) URL.revokeObjectURL(a.href);
		a.href = URL.createObjectURL(await getBlob());
	}
}

export function getBlob() {
	return new Promise(resolve => CN.toBlob(resolve));
}

addEventListener("fen", draw);

function drawPiece(i, j, value, light) {
	const size = store.board.size;
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
	if(typeIndex < 0 && !isText) return false;

	if(isText) drawBlank(i, j, light);
	bCtx.save();
	const bw = store.board.blackWhite;
	const sx = neutral ? (bw ? 0 : 2) : value == lower ? 0 : 1;
	const f = neutral && bw ? (lower == "n" ? store.board.knightOffset : .5) : 1;
	const bx = store.board.grayBG ? 6 : light ? 3 : 0;
	const [rx, ry] = [(rotate + 1 & 2) ? 1 : 0, rotate & 2 ? 1 : 0];
	bCtx.translate((j + rx) * size + 1, (i + ry) * size + 1);
	if(rotate !== 0) bCtx.rotate(Math.PI / 2 * rotate);
	if(isText) {
		const c = value.substring(1);
		const text = value.startsWith("''") ? value.substring(2) : fullWidth(c, false) || c;
		ctx.fillStyle = gCtx.fillStyle = "black";
		const measure = ctx.measureText(text);
		const height = measure.actualBoundingBoxAscent - measure.actualBoundingBoxDescent;
		const dx = Math.max((size - measure.width) / 2, 0);
		const dy = Math.max((size - height) / 2, 0);
		bCtx.fillText(text, dx, size - dy, size);
	} else {
		ctx.drawImage(img, (sx + bx) * size, typeIndex * size, size * f, size, 0, 0, size * f, size);
		gCtx.drawImage(img, (sx + 6) * size, typeIndex * size, size * f, size, 0, 0, size * f, size);
		if(neutral && bw) {
			ctx.drawImage(img, (1 + f + bx) * size, typeIndex * size, size * (1 - f), size, size * f, 0, size * (1 - f), size);
			gCtx.drawImage(img, (7 + f) * size, typeIndex * size, size * (1 - f), size, size * f, 0, size * (1 - f), size);
		}
	}
	bCtx.restore();
	return true;
}

const bCtx = new Proxy({}, {
	get(target, name) {
		return function(...args) {
			ctx[name](...args);
			if(!mode.dragging) gCtx[name](...args);
		};
	},
});

function drawBlank(i, j, light) {
	if(store.board.grayBG) {
		ctx.fillStyle = light ? "#fff" : "#bbb";
	} else {
		ctx.fillStyle = light ? "#FFCE9E" : "#D18B47";
	}
	const size = store.board.size;
	ctx.fillRect(j * size + 1, i * size + 1, size, size);
}