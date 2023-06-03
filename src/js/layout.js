import { CN, SN, CG, TP, TPG } from "./el";
import { getRenderSize, store } from "./store";
import { load } from "./render";
import { setSquareSize, createSquares, container } from "./squares";
import { BORDER, parseBorder } from "./option";
import { drawBorder } from "./draw";

export const mode = {
	hor: false,
	collapse: false,
	dragging: false,
};

const Zone = document.getElementById("Zone");
const DragZone = document.getElementById("DragZone");
const EditZone = document.getElementById("EditZone");

function setSize(p, force) {
	const options = store.board;
	for(const key of ["size", "border", "w", "h"]) {
		if(p[key] === undefined) p[key] = options[key];
	}
	const rem = getREM();
	const newMode = document.body.clientWidth < (p.w + 3) * p.size + 2.5 * rem;
	const dimChange = p.w !== options.w || p.h !== options.h;
	const shouldRedraw = newMode !== mode.hor || p.size !== options.size || p.border !== options.border;
	if(dimChange || force) {
		options.w = p.w;
		options.h = p.h;
		createSquares();
	}
	if(shouldRedraw || dimChange || force) {
		mode.hor = newMode;
		options.size = p.size;
		options.border = p.border;
		const border = parseBorder(p.border);
		const wpx = p.w * p.size + 2 * border.size;
		const hpx = p.h * p.size + 2 * border.size;
		CN.style.width = wpx + "px";

		if(CN.width !== wpx) SN.width = CG.width = CN.width = wpx;
		if(CN.height !== hpx) SN.height = CG.height = CN.height = hpx;
		const u3 = 3 * p.size + 2 * border.size;
		const u8 = 8 * p.size + 2 * border.size;
		if(mode.hor) {
			if(TP.height !== u3) TPG.height = TP.height = u3;
			if(TP.width !== u8) TPG.width = TP.width = u8;
			CN.classList.add("mb-3");
			TP.classList.remove("ms-4");
		} else {
			if(TP.height !== u8) TPG.height = TP.height = u8;
			if(TP.width !== u3) TPG.width = TP.width = u3;
			CN.classList.remove("mb-3");
			TP.classList.add("ms-4");
		}

		// EditZone border
		const r = getRenderSize();
		container.style.borderWidth = r.b + "px";
		drawBorder(SN.getContext("2d"), border, wpx, hpx);

		load(options.set);
	}
	resize();
}

window.setSize = setSize;

window.setBorder = function(el) {
	if(!el.value.match(BORDER)) {
		el.value = store.board.border;
	} else {
		setSize({ border: el.value });
	}
}

window.setHeight = function(el) {
	const h = Math.floor(Number(el.value));
	if(isNaN(h) || h <= 0) {
		el.value = store.board.h;
	} else {
		setSize({ h });
	}
}

window.setWidth = function(el) {
	const w = Math.floor(Number(el.value));
	if(isNaN(w) || w <= 0) {
		el.value = store.board.w;
	} else {
		setSize({ w });
	}
}

function resize() {
	CG.style.width = CN.clientWidth + "px";
	CG.style.height = CN.clientHeight + "px";
	TPG.style.width = TP.clientWidth + "px";
	TPG.style.height = TP.clientHeight + "px";

	setSquareSize();

	const rem = getREM();
	if(Zone.clientWidth < DragZone.clientWidth + CN.clientWidth + 6 * rem) {
		EditZone.style.marginTop = -DragZone.clientHeight + "px";
		EditZone.style.width = DragZone.clientWidth + "px";
		EditZone.style.textAlign = mode.hor ? "center" : "start";
		mode.collapse = true;
	} else {
		EditZone.style.marginTop = "0";
		EditZone.style.width = "unset";
		EditZone.style.textAlign = "unset";
		mode.collapse = false;
	}
}

function getREM() {
	return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function setupLayout() {
	const handler = force => setSize({}, force);
	window.addEventListener("resize", handler);
	handler(true);
	setTimeout(resize, 1000); // This is needed on old Safari
}
