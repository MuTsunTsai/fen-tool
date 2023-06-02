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

function setSize(s, b, force) {
	const rem = getREM();
	const border = parseBorder(b);
	const newMode = document.body.clientWidth < 11 * s + 4 * b + 2 * rem;
	if(newMode !== mode.hor || s !== store.board.size || b !== store.board.border || force) {
		mode.hor = newMode;
		store.board.size = s;
		store.board.border = b;
		const w = 8 * s + 2 * border.size;
		const h = 8 * s + 2 * border.size;
		CN.style.width = w + "px";
		SN.width = CG.width = CN.width = w;
		SN.height = CG.height = CN.height = h;
		if(mode.hor) {
			TPG.height = TP.height = 3 * s + 2 * border.size;
			TPG.width = TP.width = 8 * s + 2 * border.size;
			CN.classList.add("mb-3");
			TP.classList.remove("ms-4");
		} else {
			TPG.width = TP.width = 3 * s + 2 * border.size;
			TPG.height = TP.height = 8 * s + 2 * border.size;
			CN.classList.remove("mb-3");
			TP.classList.add("ms-4");
		}

		// EditZone border
		const r = getRenderSize();
		container.style.borderWidth = r.b + "px";
		drawBorder(SN.getContext("2d"), border, w, h);

		load(store.board.set);
	}
	resize();
}

window.setSize = setSize;

window.setBorder = function(el) {
	if(!el.value.match(BORDER)) {
		el.value = store.board.border;
		return;
	} else {
		setSize(store.board.size, el.value);
	}
}

function resize() {
	CG.style.width = CG.style.height = CN.style.height = CN.clientWidth + "px";
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
	window.addEventListener("resize", () => setSize(store.board.size, store.board.border));
	createSquares();
	setSize(store.board.size, store.board.border, true);
	setTimeout(resize, 1000); // This is needed on old Safari
}
