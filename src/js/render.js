import { CN, CG, TP, TPG } from "./el";
import { mode } from "./layout";
import { store, state } from "./store";
import { pushState, squares } from "./squares";
import { background, drawPiece, drawBorder } from "./draw";
import { parseBorder } from "./option";

export const templateValues = "k,K,-k,q,Q,-q,b,B,-b,n,N,-n,r,R,-r,p,P,-p,c,C,-c,x,X,-x".split(",");

const img = new Image();

if(location.protocol == "https:") img.crossOrigin = "anonymous";
else document.getElementById("B64").disabled = true;

export function load() {
	return new Promise(resolve => {
		state.loading = true;
		img.onload = () => {
			state.loading = false;
			resolve();
		};
		img.src = TPG.src = `assets/${store.board.set}${store.board.size}.png`;
	});
}

const ctx = CN.getContext("2d");
const gCtx = CG.getContext("2d");
const tCtx = TP.getContext("2d");
const tgCtx = TPG.getContext("2d");

export function drawTemplate() {
	const options = store.board;
	const size = options.size;
	const border = parseBorder(store.board.border);
	let w = 3 * size + border.size * 2, h = 8 * size + border.size * 2;
	if(mode.hor) [w, h] = [h, w];
	tCtx.fillStyle = "black";
	tCtx.fillRect(0, 0, w, h);
	tgCtx.clearRect(0, 0, w, h);
	tCtx.save();
	tgCtx.save();
	drawBorder(tCtx, border, w, h);
	tCtx.translate(border.size, border.size);
	tgCtx.translate(border.size, border.size);
	for(let i = 0; i < 3; i++) {
		for(let j = 0; j < 8; j++) {
			const bg = Boolean((i + j) % 2) ? 1 : 0;
			const [x, y] = mode.hor ? [i, j] : [j, i];
			const value = templateValues[j * 3 + i];
			drawPiece(tCtx, img, x, y, value, bg, options);
			drawPiece(tgCtx, img, x, y, value, 2, options);
		}
	}
	tCtx.restore();
	tgCtx.restore();
}

export async function draw() {
	const options = store.board;
	const border = parseBorder(options.border);
	const w = options.w * options.size + 2 * border.size;
	const h = options.h * options.size + 2 * border.size;
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, w, h);
	if(!mode.dragging) gCtx.clearRect(0, 0, w, h);
	ctx.font = gCtx.font = `${options.size - 4}px arial`;
	ctx.save();
	gCtx.save();
	drawBorder(ctx, border, w, h);
	ctx.translate(border.size, border.size);
	gCtx.translate(border.size, border.size);
	for(let i = 0; i < options.h; i++) {
		for(let j = 0; j < options.w; j++) {
			const bg = background(options.pattern, i, j);
			const value = squares[i * options.w + j].value;
			drawPiece(ctx, img, i, j, value, bg, options);
			drawPiece(gCtx, img, i, j, value, 2, options);
		}
	}
	ctx.restore();
	gCtx.restore();

	if(!mode.dragging) pushState();
	if(location.protocol == "https:") {
		const a = document.getElementById("Save");
		if(a.href) URL.revokeObjectURL(a.href);
		a.href = URL.createObjectURL(await getBlob());
	}
}

export function getBlob() {
	return new Promise(resolve => CN.toBlob(resolve));
}
