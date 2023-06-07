import { CN, CG, TP, TPG, PV } from "./meta/el";
import { mode } from "./layout";
import { store, state } from "./store";
import { pushState, snapshot } from "./squares";
import { drawBoard } from "./draw";
import { assets, loadAsset } from "./asset";

export const templateValues = "k,K,-k,q,Q,-q,b,B,-b,n,N,-n,r,R,-r,p,P,-p,c,C,-c,x,X,-x".split(",");
const templateHorValues = "k,q,b,n,r,p,c,x,K,Q,B,N,R,P,C,X,-k,-q,-b,-n,-r,-p,-c,-x".split(",");

export async function load() {
	state.loading = true;
	await loadAsset("assets", store.board);
	state.loading = false;
}

const ctx = CN.getContext("2d");
const gCtx = CG.getContext("2d");
const tCtx = TP.getContext("2d");
const tgCtx = TPG.getContext("2d");

export function drawTemplate() {
	const options = Object.assign({}, store.board, mode.hor ? { w: 8, h: 3 } : { w: 3, h: 8 });
	const squares = mode.hor ? templateHorValues : templateValues;
	drawBoard(tCtx, assets, squares, options);
	drawBoard(tgCtx, assets, squares, options, true);
}

export async function draw(skip) {
	const options = store.board;
	const squares = snapshot();
	if(skip !== undefined) squares[skip] = "";
	drawBoard(ctx, assets, squares, options);
	if(!mode.dragging) drawBoard(gCtx, assets, squares, options, true);

	if(!mode.dragging) pushState();
	if(location.protocol.startsWith("http")) {
		const a = document.getElementById("Save");
		if(a.href) URL.revokeObjectURL(a.href);
		PV.src = a.href = URL.createObjectURL(await getBlob());
	}
}

export function drawEmpty(ctx) {
	const { w, h } = store.board;
	drawBoard(ctx, assets, Array.from({ length: w * h }, _ => ""), store.board);
}

export function getBlob() {
	return new Promise(resolve => CN.toBlob(resolve));
}
