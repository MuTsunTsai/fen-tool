import { CN, CG, TP, TPG, PV } from "./meta/el";
import { setOption } from "./layout";
import { store, state, noEditing, status } from "./store";
import { pushState, snapshot } from "./squares";
import { drawBoard, types } from "./draw";
import { loadAsset } from "./asset";
import { getDimensions } from "./meta/option";
import { deepAssign } from "./meta/clone.mjs";
import { dpr } from "./meta/env";
import { animeSettings } from "./animation";
import { emptyBoard } from "./meta/fen.mjs";

export const templateValues = "k,K,-k,q,Q,-q,b,B,-b,n,N,-n,r,R,-r,p,P,-p,c,C,-c,x,X,-x".split(",");
const templateHorValues = "k,q,b,n,r,p,c,x,K,Q,B,N,R,P,C,X,-k,-q,-b,-n,-r,-p,-c,-x".split(",");

function getExportDPR() {
	return store.board.exHigh ? 2 : 1;
}

export async function load() {
	status.loading = true;
	const tasks = [loadAsset("assets", store.board, dpr)];
	const exDPR = getExportDPR();
	if(dpr != exDPR) tasks.push(loadAsset("assets", store.board, exDPR));
	await Promise.all(tasks);
	status.loading = false;
}

export const ctx = CN.getContext("2d");
const gCtx = CG.getContext("2d");
const tCtx = TP.getContext("2d");
const tgCtx = TPG.getContext("2d");

export const CE = document.createElement("canvas");
const eCtx = CE.getContext("2d");

const cache = {
	except: undefined,
	data: undefined,
};

animeSettings.ctx = ctx;

addEventListener("storage", e => {
	if(e.storageArea == localStorage && e.key == "settings") {
		const settings = JSON.parse(localStorage.getItem("settings"));
		deepAssign(store, settings, true);
		setOption({}, true);
	}
});

/**
 * @param {number[]} except 
 */
export function drawTemplate(except) {
	if(except) cache.except = except;
	else except = cache.except;
	const options = Object.assign({}, store.board, status.hor ? { w: 8, h: 3 } : { w: 3, h: 8 });
	const squares = getTemplate();
	drawBoard(tCtx, squares, options, dpr, false, status.hor);
	const { size } = store.board;
	if(!noEditing()) {
		drawBoard(tgCtx, squares, options, dpr, true, status.hor);
		if(status.selection) {
			tCtx.save();
			const { offset } = getDimensions(store.board, status.hor);
			tCtx.lineWidth = size / 12;
			tCtx.strokeStyle = "#0d6efd";
			tCtx.translate(offset.x, offset.y);
			const index = squares.indexOf(status.selection);
			const x = index % options.w, y = (index - x) / options.w;
			drawSelection(x, y);
			tCtx.restore();
		}
	} else {
		const isRetro = state.play.mode == "retro";
		tCtx.save();
		const { offset } = getDimensions(store.board, status.hor);
		tCtx.translate(offset.x, offset.y);

		// draw "ep"
		if(isRetro) {
			tCtx.save();
			tCtx.font = `${size / 2}px sans-serif`;
			tCtx.strokeStyle = "black";
			tCtx.lineWidth = size / 12;
			tCtx.fillStyle = "white";
			tCtx.lineJoin = "round";
			drawEp(1, 7);
			drawEp(2, 7);
			tCtx.restore();
		}

		// draw mask
		tCtx.save();
		tCtx.globalAlpha = status.isDark ? 0.5 : 0.4;
		tCtx.fillStyle = "black";
		for(let i = 0; i < 3; i++) {
			for(let j = 0; j < 8; j++) {
				if(except?.includes(j * 3 + i)) continue;
				const [x, y] = status.hor ? [j, i] : [i, j];
				tCtx.fillRect(x * size, y * size, size, size);
			}
		}
		tCtx.restore();

		// draw selection
		if(isRetro) {
			tCtx.save();
			const retro = state.play.retro;
			const x = except[0] == 3 ? 0 : 1;
			tCtx.lineWidth = size / 12;
			tCtx.strokeStyle = "#0d6efd";
			if(retro.uncapture) drawSelection(x, types.indexOf(retro.uncapture));
			if(retro.unpromote) drawSelection(1 - x, 5);
			tCtx.restore();
		}
		tCtx.restore();
	}
}

function getTemplate() {
	let result = status.hor ? templateHorValues : templateValues;
	if(state.play.playing && state.play.mode == "retro") {
		result = result.concat();
		if(status.hor) {
			result[6] = "p";
			result[14] = "P";
		} else {
			result[18] = "p";
			result[19] = "P";
		}
	}
	return result;
}

function drawEp(x, y) {
	const { size } = store.board;
	const offset = size / 15;
	if(status.hor) [x, y] = [y, x];
	const measure = tCtx.measureText("ep");
	const width = measure.width;
	const descent = measure.actualBoundingBoxDescent;
	tCtx.strokeText("ep", x * size - width - offset, y * size - descent - offset);
	tCtx.fillText("ep", x * size - width - offset, y * size - descent - offset);
}

function drawSelection(x, y) {
	const { size } = store.board;
	const unit = size / 8;
	if(status.hor) [x, y] = [y, x];
	const offset = .5;
	const draw = (...pt) => {
		tCtx.moveTo(x * size + unit * (pt[0][0] + offset), y * size + unit * (pt[0][1] + offset));
		for(let i = 1; i < pt.length; i++)tCtx.lineTo(x * size + unit * (pt[i][0] + offset), y * size + unit * (pt[i][1] + offset));
	};
	tCtx.beginPath();
	draw([0, 2], [0, 0], [2, 0]);
	draw([5, 0], [7, 0], [7, 2]);
	draw([7, 5], [7, 7], [5, 7]);
	draw([0, 5], [0, 7], [2, 7]);
	tCtx.stroke();
}

export async function draw(data) {
	if(data) cache.data = data;
	else data = cache.data || snapshot();
	const options = store.board;
	drawBoard(ctx, data, options, dpr);
	drawBoard(eCtx, data, options, getExportDPR());
	updatePieceCount(data);
	if(!status.dragging) {
		drawBoard(gCtx, data, options, dpr, true);
		pushState();
	}
	if(location.protocol.startsWith("http")) {
		const a = document.getElementById("Save");
		if(a.href) URL.revokeObjectURL(a.href);
		PV.src = a.href = URL.createObjectURL(await getBlob());
	}
}

function updatePieceCount(data) {
	let w = 0, b = 0, n = 0, t = 0;
	for(const s of data) {
		if(s == "") continue;
		if(s.startsWith("'")) t++;
		else if(s.startsWith("-")) n++;
		else if(s == s.toUpperCase()) w++;
		else b++;
	}
	status.pieceCount = `(${w}+${b}${n > 0 ? "+" + n : ""}${t > 0 ? "+" + t : ""})`;
}

export function drawEmpty(ctx) {
	const { w, h } = store.board;
	drawBoard(ctx, emptyBoard(w * h), store.board, dpr);
}

export function getBlob() {
	return new Promise(resolve => CE.toBlob(resolve));
}
