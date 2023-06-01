import { CN, CG, TP, TPG } from "./el";
import { mode } from "./layout";
import { store, state } from "./store";
import { squares } from "./squares";
import { drawPiece } from "./draw";

export const templateValues = "k,K,-k,q,Q,-q,b,B,-b,n,N,-n,r,R,-r,p,P,-p,c,C,-c,x,X,-x".split(",");

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
const tCtx = TP.getContext("2d");
const tgCtx = TPG.getContext("2d");

export function drawTemplate() {
	const options = store.board;
	const size = options.size;
	let w = 3 * size + 2, h = 8 * size + 2;
	if(mode.hor) [w, h] = [h, w];
	tCtx.fillStyle = "black";
	tCtx.fillRect(0, 0, w, h);
	tgCtx.clearRect(0, 0, w, h);
	for(let i = 0; i < 3; i++) {
		for(let j = 0; j < 8; j++) {
			const bg = Boolean((i + j) % 2) ? 1 : 0;
			const [x, y] = mode.hor ? [i, j] : [j, i];
			const value = templateValues[j * 3 + i];
			drawPiece(tCtx, img, x, y, value, bg, options);
			drawPiece(tgCtx, img, x, y, value, 2, options);
		}
	}
	draw();
}

export async function draw() {
	const options = store.board;
	const full = 8 * options.size + 2;
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, full, full);
	if(!mode.dragging) gCtx.clearRect(0, 0, full, full);
	ctx.font = gCtx.font = `${options.size - 4}px arial`;
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const bg = options.uncolored || options.inverted == Boolean((i + j) % 2) ? 1 : 0;
			const value = squares[i * 8 + j].value;
			drawPiece(ctx, img, i, j, value, bg, options);
			drawPiece(gCtx, img, i, j, value, 2, options);
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
