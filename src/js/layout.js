import { nextTick } from "vue";

import { deepAssign } from "./meta/clone";
import { CG, CN, SN, TP, TPG } from "./meta/el";
import { getRenderSize, search, state, status, store } from "./store";
import { draw, drawEmpty, drawTemplate, load } from "./render";
import { callback, container, createSquares, paste, pushState, setFEN, setSquareSize, snapshot, toFEN } from "./squares";
import { getDimensions, sanitizeBorder } from "./meta/option";
import { dpr, env } from "./meta/env";
import { redrawSDK } from "./api/sdk-base";
import { BOARD_SIZE, ONE_SECOND, TEMPLATE_SIZE } from "./meta/constants";

const PX = "px";

const Zone = document.getElementById("Zone");
const DragZone = document.getElementById("DragZone");
const EditZone = document.getElementById("EditZone");

function bodyWidth() {
	return document.body.clientWidth / (state.split ? 2 : 1);
}

export async function setOption(o, force) {
	const options = store.board;
	const changed = {};
	for(const key in options) {
		changed[key] = o[key] !== undefined && o[key] !== options[key];
		if(changed[key]) options[key] = o[key];
		else o[key] = options[key];
	}
	const { border, margin, w, h } = getDimensions(o);

	// Decide mode
	const rem = getREM();
	const newMode = bodyWidth() < (o.w + 3) * o.size + margin.x + 4 * border.size + 4.2 * rem;
	changed.mode = newMode !== status.hor;
	status.hor = newMode;

	const dimChange = changed.w || changed.h;
	if(dimChange || force) createSquares();

	const shouldUpdateAsset = force || changed.set || changed.size;
	const shouldRedraw = shouldUpdateAsset || changed.border;
	const shouldDrawBoard = shouldRedraw || dimChange;
	const shouldDrawTemplate = shouldRedraw || changed.mode;

	if(shouldDrawTemplate) setupTemplate(o.size, border.size, margin);
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

function setupTemplate(size, borderSize, margin) {
	let tw = (TEMPLATE_SIZE * size + 2 * borderSize) * dpr;
	let th = (BOARD_SIZE * size + 2 * borderSize) * dpr;
	if(status.hor) {
		[tw, th] = [th + margin.x * dpr, tw];
		CN.parentNode.classList.add("mb-3");
		TP.classList.remove("ms-4");
	} else {
		th += margin.y * dpr;
		CN.parentNode.classList.remove("mb-3");
		TP.classList.add("ms-4");
	}
	if(TP.width !== tw || TP.height !== th) {
		TPG.width = TP.width = tw;
		TPG.height = TP.height = th;
	}
}

function setupBoard(w, h) {
	const bw = w * dpr;
	const bh = h * dpr;
	if(CN.width !== bw || CN.height !== bh) {
		SN.width = CG.width = CN.width = bw;
		SN.height = CG.height = CN.height = bh;
	}
	drawEmpty(SN.getContext("2d"));
}

function setDimension(dim) {
	const { w, h } = store.board;
	const shot = snapshot();
	setOption(dim);
	paste(shot, w, h);
}

export function resize() {
	Zone.style.maxWidth = `calc(${bodyWidth()}px + 1rem)`;
	CN.style.width = CN.width / dpr + PX;
	TP.style.width = TP.width / dpr + PX;
	const { w } = store.board;
	const r = getRenderSize(undefined, undefined, BOARD_SIZE);
	if(status.hor) {
		if(w > BOARD_SIZE) {
			TP.style.width = r.width + PX;
		} else if(w < BOARD_SIZE) {
			const { width } = getRenderSize(TP, true, w);
			CN.style.width = width + PX;
		}
	}
	container.style.borderWidth = `${r.offset.y}px ${r.offset.r}px ${r.offset.b}px ${r.offset.x}px`;

	const rem = getREM();
	if(store.board.collapse) {
		Zone.style.width = "120%"; // First we enlarge the whole thing, to correctly measure DragZone.
		Zone.style.width = DragZone.clientWidth + 4 * rem + PX; // Then we set the size by DragZone.
	} else {
		Zone.style.width = "unset";
	}

	CG.style.width = CN.clientWidth + PX;
	CG.style.height = CN.clientHeight + PX;
	TPG.style.width = TP.clientWidth + PX;
	TPG.style.height = TP.clientHeight + PX;

	setSquareSize(r.s);

	if(Zone.clientWidth < DragZone.clientWidth + CN.clientWidth + 6 * rem) {
		EditZone.style.marginTop = -DragZone.clientHeight + PX;
		EditZone.style.width = DragZone.clientWidth + PX;
		status.collapse = true;
	} else {
		EditZone.style.marginTop = "0";
		EditZone.style.width = "unset";
		status.collapse = false;
	}
}

function getREM() {
	return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export async function initLayout() {
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
	if(typeof ResizeObserver !== "undefined") {
		const observer = new ResizeObserver(e => parent.resizeIframe());
		observer.observe(document.body);
	} else {
		// fallback to MutationObserver
		const observer = new MutationObserver(e => parent.resizeIframe());
		observer.observe(document.body, { childList: true });
	}
	parent.resizeIframe(); // init
} else {
	window.resizeIframe = function() {
		const iframe = document.getElementsByTagName("iframe")[0];
		if(!iframe) return;
		iframe.style.minHeight = iframe.contentDocument.body.scrollHeight + PX;
	};
}

export const Layout = {
	setDimension,
	setBorder(el) {
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
		const settings = JSON.parse(localStorage.getItem("settings"));
		deepAssign(store, settings, true);
		setOption({}, true);
	}
});
