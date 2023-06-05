import { CN, CG, TP, TPG, PV } from "./meta/el";
import { mode } from "./layout";
import { store, state } from "./store";
import { pushState, snapshot } from "./squares";
import { drawBoard } from "./draw";

export const templateValues = "k,K,-k,q,Q,-q,b,B,-b,n,N,-n,r,R,-r,p,P,-p,c,C,-c,x,X,-x".split(",");
const templateHorValues = "k,q,b,n,r,p,c,x,K,Q,B,N,R,P,C,X,-k,-q,-b,-n,-r,-p,-c,-x".split(",");

const img = new Image();

if(location.protocol == "https:") img.crossOrigin = "anonymous";

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
	const options = Object.assign({}, store.board, mode.hor ? { w: 8, h: 3 } : { w: 3, h: 8 });
	const squares = mode.hor ? templateHorValues : templateValues;
	drawBoard(tCtx, img, squares, options);
	drawBoard(tgCtx, img, squares, options, true);
}

export async function draw() {
	const options = store.board;
	const squares = snapshot();
	drawBoard(ctx, img, squares, options);
	if(!mode.dragging) drawBoard(gCtx, img, squares, options, true);

	if(!mode.dragging) pushState();
	if(location.protocol.startsWith("http")) {
		const a = document.getElementById("Save");
		if(a.href) URL.revokeObjectURL(a.href);
		PV.src = a.href = URL.createObjectURL(await getBlob());
	}
}

export function getBlob() {
	return new Promise(resolve => CN.toBlob(resolve));
}
