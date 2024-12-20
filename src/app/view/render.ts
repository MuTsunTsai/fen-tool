import { cnvMain, cnvGhost, cnvTemplate, cnvTempGhost, imgOverlay, cnvSquares } from "app/meta/el";
import { store, state, noEditing, status } from "app/store";
import { pushState, createSnapshot } from "app/interface/squares";
import { drawBoard } from "./draw";
import { loadAsset } from "./asset";
import { getDimensions } from "app/meta/option";
import { dpr } from "app/meta/env";
import { animeSettings } from "./animation";
import { emptyBoard } from "app/meta/fen";
import { redrawSDK } from "app/api/sdk-base";
import { BOARD_SIZE, TEMPLATE_SIZE } from "app/meta/constants";
import { TemplateMap, TemplateRow } from "app/meta/enum";
import { types } from "./piece";

const SELECTION_WIDTH_FACTOR = 12;
const SELECTION_GRID = 8;
const SELECTION_OFFSET = 5;
const TEXT_BORDER_WIDTH_FACTOR = 12;
const TEXT_OFFSET_FACTOR = 15;
const MASK_ALPHA_DARK = 0.5;
const MASK_ALPHA_LIGHT = 0.4;

export const templateValues = "k,K,-k,q,Q,-q,b,B,-b,n,N,-n,r,R,-r,p,P,-p,c,C,-c,x,X,-x".split(",");
const templateHorValues = "k,q,b,n,r,p,c,x,K,Q,B,N,R,P,C,X,-k,-q,-b,-n,-r,-p,-c,-x".split(",");

function getExportDPR(): number {
	return store.board.exHigh ? 2 : 1;
}

export async function load(): Promise<void> {
	status.loading = true;
	const tasks = [loadAsset("./assets", store.board, dpr)];
	const exDPR = getExportDPR();
	if(dpr != exDPR) tasks.push(loadAsset("./assets", store.board, exDPR));
	await Promise.all(tasks);
	status.loading = false;
}

export const ctxMain = cnvMain.getContext("2d")!;
const ctxGhost = cnvGhost.getContext("2d")!;
const ctxTemplate = cnvTemplate.getContext("2d")!;
const ctxTempGhost = cnvTempGhost.getContext("2d")!;

export const cnvHidden = document.createElement("canvas");
const ctxHidden = cnvHidden.getContext("2d")!;

const cache = {
	except: undefined as number[] | undefined,
	data: undefined as string[] | undefined,
};

animeSettings.ctx = ctxMain;

export function drawTemplate(except?: number[]): void {
	if(except) cache.except = except;
	else except = cache.except!;
	const options = Object.assign(
		{},
		store.board,
		status.hor ?
			{ w: BOARD_SIZE, h: TEMPLATE_SIZE } :
			{ w: TEMPLATE_SIZE, h: BOARD_SIZE }
	);
	const squares = getTemplate();
	drawBoard(ctxTemplate, squares, options, dpr, false, status.hor);
	const { size } = store.board;
	if(!noEditing()) {
		drawBoard(ctxTempGhost, squares, options, dpr, true, status.hor);
		if(status.selection) {
			ctxTemplate.save();
			const { offset } = getDimensions(store.board, status.hor);
			ctxTemplate.lineWidth = size / SELECTION_WIDTH_FACTOR;
			ctxTemplate.strokeStyle = "#0d6efd";
			ctxTemplate.translate(offset.x, offset.y);
			const index = templateValues.indexOf(status.selection);
			const x = index % TEMPLATE_SIZE;
			const y = (index - x) / TEMPLATE_SIZE;
			drawSelectionCore(x, y);
			ctxTemplate.restore();
		}
	} else {
		const isRetro = state.play.mode == "retro";
		ctxTemplate.save();
		const { offset } = getDimensions(store.board, status.hor);
		ctxTemplate.translate(offset.x, offset.y);

		if(isRetro) drawEp(size);
		drawMask(except, size);
		if(isRetro) drawSelection(except, size);
		ctxTemplate.restore();
	}
}

function drawEp(size: number): void {
	ctxTemplate.save();
	ctxTemplate.font = `${size / 2}px sans-serif`;
	ctxTemplate.strokeStyle = "black";
	ctxTemplate.lineWidth = size / TEXT_BORDER_WIDTH_FACTOR;
	ctxTemplate.fillStyle = "white";
	ctxTemplate.lineJoin = "round";
	drawEpCore(1, TemplateRow.x);
	drawEpCore(2, TemplateRow.x);
	ctxTemplate.restore();
}

function drawMask(except: number[], size: number): void {
	ctxTemplate.save();
	ctxTemplate.globalAlpha = status.isDark ? MASK_ALPHA_DARK : MASK_ALPHA_LIGHT;
	ctxTemplate.fillStyle = "black";
	for(let i = 0; i < TEMPLATE_SIZE; i++) {
		for(let j = 0; j < BOARD_SIZE; j++) {
			if(except?.includes(j * TEMPLATE_SIZE + i)) continue;
			const [x, y] = status.hor ? [j, i] : [i, j];
			ctxTemplate.fillRect(x * size, y * size, size, size);
		}
	}
	ctxTemplate.restore();
}

function drawSelection(except: number[], size: number): void {
	ctxTemplate.save();
	const retro = state.play.retro;
	const x = except[0] == TemplateMap.bQ ? 0 : 1;
	ctxTemplate.lineWidth = size / SELECTION_WIDTH_FACTOR;
	ctxTemplate.strokeStyle = "#0d6efd";
	if(retro.uncapture) drawSelectionCore(x, types.indexOf(retro.uncapture));
	if(retro.unpromote) drawSelectionCore(1 - x, SELECTION_OFFSET);
	ctxTemplate.restore();
}

function getTemplate(): string[] {
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

function drawEpCore(x: number, y: number): void {
	const { size } = store.board;
	const offset = size / TEXT_OFFSET_FACTOR;
	if(status.hor) [x, y] = [y, x];
	const measure = ctxTemplate.measureText("ep");
	const width = measure.width;
	const descent = measure.actualBoundingBoxDescent;
	ctxTemplate.strokeText("ep", x * size - width - offset, y * size - descent - offset);
	ctxTemplate.fillText("ep", x * size - width - offset, y * size - descent - offset);
}

function drawSelectionCore(x: number, y: number): void {
	const { size } = store.board;
	const unit = size / SELECTION_GRID;
	if(status.hor) [x, y] = [y, x];
	const offset = 0.5;
	const drawLines = (...line: [number, number][][]): void => {
		for(const pt of line) {
			ctxTemplate.moveTo(x * size + unit * (pt[0][0] + offset), y * size + unit * (pt[0][1] + offset));
			for(let i = 1; i < pt.length; i++) {
				ctxTemplate.lineTo(x * size + unit * (pt[i][0] + offset), y * size + unit * (pt[i][1] + offset));
			}
		}
	};
	ctxTemplate.beginPath();
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	drawLines([[0, 2], [0, 0], [2, 0]], [[5, 0], [7, 0], [7, 2]], [[7, 5], [7, 7], [5, 7]], [[0, 5], [0, 7], [2, 7]]);
	ctxTemplate.stroke();
}

export async function draw(data?: string[]): Promise<void> {
	if(data) cache.data = data;
	else data = cache.data || createSnapshot();
	const options = store.board;
	drawBoard(ctxMain, data, options, dpr);
	drawBoard(ctxHidden, data, options, getExportDPR());
	updatePieceCount(data);
	if(!status.dragging) {
		drawBoard(ctxGhost, data, options, dpr, true);
		pushState();
	}
	if(location.protocol.startsWith("http")) {
		const a = document.getElementById("Save") as HTMLAnchorElement;
		if(a.href) URL.revokeObjectURL(a.href);
		imgOverlay.src = a.href = URL.createObjectURL(await getBlob());
	}
}

function updatePieceCount(data: string[]): void {
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

export function drawEmpty(context: CanvasRenderingContext2D): void {
	const { w, h } = store.board;
	drawBoard(context, emptyBoard(w * h), store.board, dpr);
}

export function getBlob(): Promise<Blob> {
	return new Promise<Blob>(resolve => cnvHidden.toBlob(resolve as BlobCallback));
}

export function updateBG(): void {
	drawEmpty(cnvSquares.getContext("2d")!);
	redraw();
}

export function redraw(): void {
	draw();
	drawTemplate();
	if(store.project.length) redrawSDK();
}

export async function drawExport(): Promise<void> {
	await load();
	draw();
}
