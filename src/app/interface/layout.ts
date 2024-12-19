import { nextTick } from "vue";

import { deepAssign } from "app/meta/clone";
import { cnvGhost, cnvMain, cnvSquares, cnvTemplate, cnvTempGhost } from "app/meta/el";
import { getRenderSize, search, state, status, store } from "app/store";
import { draw, drawEmpty, drawTemplate, load } from "app/view/render";
import { callback, container, createSquares, paste, pushState, setFEN, setSquareSize, createSnapshot, toFEN } from "./squares";
import { getDimensions, sanitizeBorder } from "app/meta/option";
import { dpr, env } from "app/meta/env";
import { redrawSDK } from "app/api/sdk-base";
import { BOARD_SIZE, ONE_SECOND, TEMPLATE_SIZE } from "app/meta/constants";

import type { BoardOptions, Border } from "app/meta/option";

const PX = "px";
const X_GAP = 2; // in rem

const Zone = document.getElementById("Zone") as HTMLDivElement;
const DragZone = document.getElementById("DragZone") as HTMLDivElement;
const EditZone = document.getElementById("EditZone") as HTMLDivElement;

function bodyWidth(): number {
	return document.body.clientWidth / (state.split ? 2 : 1);
}

// On mobile devices, canvas context might get recycled when the app goes to background.
// We force re-render when we get back to ensure everything is in display.
document.addEventListener("visibilitychange", () => {
	if(document.visibilityState == "visible") {
		draw();
		drawTemplate();
	}
});

export async function setOption(o: Partial<BoardOptions>, force?: boolean): Promise<void> {
	const options = store.board;
	const changed: Record<string, boolean> = {};
	for(const k in o) {
		const key = k as keyof BoardOptions;
		changed[key] = o[key] !== options[key];
	}
	Object.assign(options, o);
	const { border, margin, w, h } = getDimensions(options);

	// Decide mode
	const newMode = getMode(options, margin, border);
	changed.mode = newMode !== status.hor;
	status.hor = newMode;

	const dimChange = changed.w || changed.h;
	if(dimChange || force) createSquares();

	const shouldUpdateAsset = force || changed.set || changed.size;
	const shouldRedraw = shouldUpdateAsset || changed.border;
	const shouldDrawBoard = shouldRedraw || dimChange;
	const shouldDrawTemplate = shouldRedraw || changed.mode;

	if(shouldDrawTemplate) setupTemplate(options.size, border.size, margin);
	if(shouldDrawBoard) setupBoard(w, h);
	resize();

	// Async parts
	if(shouldUpdateAsset) {
		await load();
		if(store.project.length) redrawSDK();
	}
	if(shouldDrawBoard) draw();
	if(shouldDrawTemplate) drawTemplate();

	nextTick(resize); // Just in case; solves glitch in Popeye play mode
}

function getMode(o: BoardOptions, margin: IPoint, border: Border): boolean {
	const rem = getREM();
	const NUM_BORDERS = 4; // 2 for board, 2 for template
	const SENSITIVITY = 0.2; // to prevent floating error
	return bodyWidth() <
		(o.w + TEMPLATE_SIZE) * o.size + margin.x +
		NUM_BORDERS * border.size +
		(2 * X_GAP + SENSITIVITY) * rem;
}

function setupTemplate(size: number, borderSize: number, margin: IPoint): void {
	let tw = (TEMPLATE_SIZE * size + 2 * borderSize) * dpr;
	let th = (BOARD_SIZE * size + 2 * borderSize) * dpr;
	if(status.hor) [tw, th] = [th + margin.x * dpr, tw];
	else th += margin.y * dpr;
	if(cnvTemplate.width !== tw || cnvTemplate.height !== th) {
		cnvTempGhost.width = cnvTemplate.width = tw;
		cnvTempGhost.height = cnvTemplate.height = th;
	}
}

function setupBoard(w: number, h: number): void {
	const bw = w * dpr;
	const bh = h * dpr;
	if(cnvMain.width !== bw || cnvMain.height !== bh) {
		cnvSquares.width = cnvGhost.width = cnvMain.width = bw;
		cnvSquares.height = cnvGhost.height = cnvMain.height = bh;
	}
	drawEmpty(cnvSquares.getContext("2d")!);
}

function setDimension(dim: Partial<BoardOptions>): void {
	const { w, h } = store.board;
	const shot = createSnapshot();
	setOption(dim);
	paste(shot, w, h);
}

export function resize(): void {
	Zone.style.maxWidth = `calc(${bodyWidth()}px + 1rem)`;
	cnvMain.style.width = cnvMain.width / dpr + PX;
	cnvTemplate.style.width = cnvTemplate.width / dpr + PX;
	const { w } = store.board;
	const r = getRenderSize(undefined, undefined, BOARD_SIZE);
	if(status.hor) {
		if(w > BOARD_SIZE) {
			cnvTemplate.style.width = r.width + PX;
		} else if(w < BOARD_SIZE) {
			const { width } = getRenderSize(cnvTemplate, true, w);
			cnvMain.style.width = width + PX;
		}
	}
	container.style.borderWidth = `${r.offset.y}px ${r.offset.r}px ${r.offset.b}px ${r.offset.x}px`;

	const rem = getREM();
	if(store.board.collapse) {
		Zone.style.width = "120%"; // First we enlarge the whole thing, to correctly measure DragZone.
		Zone.style.width = DragZone.clientWidth + 2 * X_GAP * rem + PX; // Then we set the size by DragZone.
	} else {
		Zone.style.width = "unset";
	}

	cnvGhost.style.width = cnvMain.clientWidth + PX;
	cnvGhost.style.height = cnvMain.clientHeight + PX;
	cnvTempGhost.style.width = cnvTemplate.clientWidth + PX;
	cnvTempGhost.style.height = cnvTemplate.clientHeight + PX;

	setSquareSize(r.s);

	const NUM_GAPS = 3; // 2 on the sides and 1 in between
	if(Zone.clientWidth < DragZone.clientWidth + cnvMain.clientWidth + NUM_GAPS * X_GAP * rem) {
		EditZone.style.marginTop = -DragZone.clientHeight + PX;
		EditZone.style.width = DragZone.clientWidth + PX;
		status.collapse = true;
	} else {
		EditZone.style.marginTop = "0";
		EditZone.style.width = "unset";
		status.collapse = false;
	}
}

function getREM(): number {
	return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export async function initLayout(): Promise<void> {
	window.addEventListener("resize", () => setOption({}));
	const fen = search.get("fen");
	await setOption({}, true);
	callback.draw = draw;
	callback.setOption = setOption;
	if(fen) {
		setFEN(fen, true);
		pushState();
	} else {
		toFEN();
	}
	setTimeout(resize, ONE_SECOND); // This is needed on old Safari
}

// Split mode RWD
if(!env.isTop) {
	function resizeSelf(): void {
		try {
			parent.resizeIframe();
		} catch {
			//
		}
	}
	if(typeof ResizeObserver !== "undefined") {
		const observer = new ResizeObserver(resizeSelf);
		observer.observe(document.body);
	} else {
		// fallback to MutationObserver
		const observer = new MutationObserver(resizeSelf);
		observer.observe(document.body, { childList: true });
	}
	resizeSelf(); // init
} else {
	window.resizeIframe = function() {
		const iframe = document.getElementsByTagName("iframe")[0];
		if(!iframe) return;
		iframe.style.minHeight = iframe.contentDocument!.body.scrollHeight + PX;
	};
}

declare global {
	interface Window {
		resizeIframe: Action;
	}
}

export const Layout = {
	setDimension,
	setBorder(el: HTMLInputElement) {
		const border = sanitizeBorder(el.value);
		if(!border) {
			el.value = store.board.border;
		} else {
			el.value = border;
			setOption({ border });
		}
	},
	get set() { return store.board.set; },
	set set(v) { setOption({ set: v }); },
	get size() { return store.board.size; },
	set size(v) { setOption({ size: v }); },
	get height() { return store.board.h; },
	set height(v) { setDimension({ h: v }); },
	get width() { return store.board.w; },
	set width(v) { setDimension({ w: v }); },
};

addEventListener("storage", e => {
	if(e.storageArea == localStorage && e.key == "settings") {
		const settingsString = localStorage.getItem("settings");
		const settings = settingsString ? JSON.parse(settingsString) : null;
		deepAssign(store, settings, true);
		setOption({}, true);
	}
});
