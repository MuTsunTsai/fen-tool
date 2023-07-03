import { CN, CG, TP, TPG, PV } from "./meta/el";
import { dpr, mode, setOption } from "./layout";
import { store, state, assign } from "./store";
import { pushState, snapshot } from "./squares";
import { drawBoard } from "./draw";
import { loadAsset } from "./asset";
import { parseBorder } from "./meta/option";

export const templateValues = "k,K,-k,q,Q,-q,b,B,-b,n,N,-n,r,R,-r,p,P,-p,c,C,-c,x,X,-x".split(",");
const templateHorValues = "k,q,b,n,r,p,c,x,K,Q,B,N,R,P,C,X,-k,-q,-b,-n,-r,-p,-c,-x".split(",");

function getExportDPR() {
	return store.board.exHigh ? 2 : 1;
}

export async function load() {
	state.loading = true;
	const tasks = [loadAsset("assets", store.board, dpr)];
	const exDPR = getExportDPR();
	if(dpr != exDPR) tasks.push(loadAsset("assets", store.board, exDPR));
	await Promise.all(tasks);
	state.loading = false;
}

const ctx = CN.getContext("2d");
const gCtx = CG.getContext("2d");
const tCtx = TP.getContext("2d");
const tgCtx = TPG.getContext("2d");

export const CE = document.createElement("canvas");
const eCtx = CE.getContext("2d");

const cache = {
	except: undefined,
	data: undefined,
};

addEventListener("storage", e => {
	if(e.storageArea == localStorage && e.key == "settings") {
		const settings = JSON.parse(localStorage.getItem("settings"));
		assign(store, settings);
		setOption({}, true);
	}
});

export function drawTemplate(except) {
	if(except) cache.except = except;
	else except = cache.except;
	const options = Object.assign({}, store.board, mode.hor ? { w: 8, h: 3 } : { w: 3, h: 8 });
	const squares = mode.hor ? templateHorValues : templateValues;
	drawBoard(tCtx, squares, options, dpr);
	if(!state.play.playing) {
		drawBoard(tgCtx, squares, options, dpr, true);
	} else {
		tCtx.save();
		const border = parseBorder(store.board.border);
		tCtx.translate(border.size, border.size);
		tCtx.globalAlpha = state.isDark ? 0.5 : 0.4;
		tCtx.fillStyle = "black";
		const { size } = store.board;
		for(let i = 0; i < 3; i++) {
			for(let j = 0; j < 8; j++) {
				if(except?.includes(j * 3 + i)) continue;
				const [x, y] = mode.hor ? [j, i] : [i, j];
				tCtx.fillRect(x * size, y * size, size, size);
			}
		}
		tCtx.restore();
	}
}

export async function draw(data) {
	if(data) cache.data = data;
	else data = cache.data || snapshot();
	const options = store.board;
	drawBoard(ctx, data, options, dpr);
	drawBoard(eCtx, data, options, getExportDPR());
	if(!mode.dragging) drawBoard(gCtx, data, options, dpr, true);

	if(!mode.dragging) pushState();
	if(location.protocol.startsWith("http")) {
		const a = document.getElementById("Save");
		if(a.href) URL.revokeObjectURL(a.href);
		PV.src = a.href = URL.createObjectURL(await getBlob());
	}
}

export function drawEmpty(ctx) {
	const { w, h } = store.board;
	drawBoard(ctx, Array.from({ length: w * h }, _ => ""), store.board, dpr);
}

export function getBlob() {
	return new Promise(resolve => CE.toBlob(resolve));
}
