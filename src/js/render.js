import { CN, CG, TP, TPG, PV, SN } from "./meta/el";
import { store, state, noEditing, status } from "./store";
import { pushState, snapshot } from "./squares";
import { drawBoard, types } from "./draw";
import { loadAsset } from "./asset";
import { getDimensions } from "./meta/option";
import { dpr } from "./meta/env";
import { animeSettings } from "./animation";
import { emptyBoard } from "./meta/fen";
import { redrawSDK } from "./api/sdk-base";
import { BOARD_SIZE, TEMPLATE_SIZE } from "./meta/constants";
import { TemplateMap, TemplateRow } from "./meta/enum";

const SELECTION_WIDTH_FACTOR = 12;
const SELECTION_GRID = 8;
const SELECTION_OFFSET = 5;
const TEXT_BORDER_WIDTH_FACTOR = 12;
const TEXT_OFFSET_FACTOR = 15;
const MASK_ALPHA_DARK = 0.5;
const MASK_ALPHA_LIGHT = 0.4;

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

/**
 * @param {number[]} except
 */
export function drawTemplate(except) {
	if(except) cache.except = except;
	else except = cache.except;
	const options = Object.assign(
		{},
		store.board,
		status.hor ?
			{ w: BOARD_SIZE, h: TEMPLATE_SIZE } :
			{ w: TEMPLATE_SIZE, h: BOARD_SIZE }
	);
	const squares = getTemplate();
	drawBoard(tCtx, squares, options, dpr, false, status.hor);
	const { size } = store.board;
	if(!noEditing()) {
		drawBoard(tgCtx, squares, options, dpr, true, status.hor);
		if(status.selection) {
			tCtx.save();
			const { offset } = getDimensions(store.board, status.hor);
			tCtx.lineWidth = size / SELECTION_WIDTH_FACTOR;
			tCtx.strokeStyle = "#0d6efd";
			tCtx.translate(offset.x, offset.y);
			const index = templateValues.indexOf(status.selection);
			const x = index % TEMPLATE_SIZE;
			const y = (index - x) / TEMPLATE_SIZE;
			drawSelectionCore(x, y);
			tCtx.restore();
		}
	} else {
		const isRetro = state.play.mode == "retro";
		tCtx.save();
		const { offset } = getDimensions(store.board, status.hor);
		tCtx.translate(offset.x, offset.y);

		if(isRetro) drawEp(size);
		drawMask(except, size);
		if(isRetro) drawSelection(except, size);
		tCtx.restore();
	}
}

function drawEp(size) {
	tCtx.save();
	tCtx.font = `${size / 2}px sans-serif`;
	tCtx.strokeStyle = "black";
	tCtx.lineWidth = size / TEXT_BORDER_WIDTH_FACTOR;
	tCtx.fillStyle = "white";
	tCtx.lineJoin = "round";
	drawEpCore(1, TemplateRow.x);
	drawEpCore(2, TemplateRow.x);
	tCtx.restore();
}

function drawMask(except, size) {
	tCtx.save();
	tCtx.globalAlpha = status.isDark ? MASK_ALPHA_DARK : MASK_ALPHA_LIGHT;
	tCtx.fillStyle = "black";
	for(let i = 0; i < TEMPLATE_SIZE; i++) {
		for(let j = 0; j < BOARD_SIZE; j++) {
			if(except?.includes(j * TEMPLATE_SIZE + i)) continue;
			const [x, y] = status.hor ? [j, i] : [i, j];
			tCtx.fillRect(x * size, y * size, size, size);
		}
	}
	tCtx.restore();
}

function drawSelection(except, size) {
	tCtx.save();
	const retro = state.play.retro;
	const x = except[0] == TemplateMap.bQ ? 0 : 1;
	tCtx.lineWidth = size / SELECTION_WIDTH_FACTOR;
	tCtx.strokeStyle = "#0d6efd";
	if(retro.uncapture) drawSelectionCore(x, types.indexOf(retro.uncapture));
	if(retro.unpromote) drawSelectionCore(1 - x, SELECTION_OFFSET);
	tCtx.restore();
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

function drawEpCore(x, y) {
	const { size } = store.board;
	const offset = size / TEXT_OFFSET_FACTOR;
	if(status.hor) [x, y] = [y, x];
	const measure = tCtx.measureText("ep");
	const width = measure.width;
	const descent = measure.actualBoundingBoxDescent;
	tCtx.strokeText("ep", x * size - width - offset, y * size - descent - offset);
	tCtx.fillText("ep", x * size - width - offset, y * size - descent - offset);
}

function drawSelectionCore(x, y) {
	const { size } = store.board;
	const unit = size / SELECTION_GRID;
	if(status.hor) [x, y] = [y, x];
	const offset = 0.5;
	const drawLines = (...line) => {
		for(const pt of line) {
			tCtx.moveTo(x * size + unit * (pt[0][0] + offset), y * size + unit * (pt[0][1] + offset));
			for(let i = 1; i < pt.length; i++) {
				tCtx.lineTo(x * size + unit * (pt[i][0] + offset), y * size + unit * (pt[i][1] + offset));
			}
		}
	};
	tCtx.beginPath();
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	drawLines([[0, 2], [0, 0], [2, 0]], [[5, 0], [7, 0], [7, 2]], [[7, 5], [7, 7], [5, 7]], [[0, 5], [0, 7], [2, 7]]);
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

export function drawEmpty(context) {
	const { w, h } = store.board;
	drawBoard(context, emptyBoard(w * h), store.board, dpr);
}

export function getBlob() {
	return new Promise(resolve => CE.toBlob(resolve));
}

export function updateBG() {
	drawEmpty(SN.getContext("2d"));
	redraw();
}

export function redraw() {
	draw();
	drawTemplate();
	if(store.project.length) redrawSDK();
}

export async function drawExport() {
	await load();
	draw();
}
