import { CN, CG, TP, TPG } from "./el";
import { store } from "./store";
import { load } from "./render";
import { setSquareSize, createSquares } from "./squares";

export const mode = {
	hor: false,
	collapse: false,
	dragging: false,
};

const Zone = document.getElementById("Zone");
const DragZone = document.getElementById("DragZone");
const EditZone = document.getElementById("EditZone");

function setSize(s, force) {
	const rem = getREM();
	const newMode = document.body.clientWidth < 11 * s + 2 * rem;
	if(newMode !== mode.hor || s !== store.board.size || force) {
		mode.hor = newMode;
		store.board.size = s;
		const full = 8 * s + 2;
		CN.style.width = full + "px";
		CG.width = CN.width = full;
		CG.height = CN.height = full;
		if(mode.hor) {
			TPG.height = TP.height = 3 * s + 2;
			TPG.width = TP.width = full;
			CN.classList.add("mb-3");
			TP.classList.remove("ms-4");
		} else {
			TPG.width = TP.width = 3 * s + 2;
			TPG.height = TP.height = full;
			CN.classList.remove("mb-3");
			TP.classList.add("ms-4");
		}
		load(store.board.set);
	}
	resize();
}

window.setSize = setSize;

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
	window.addEventListener("resize", () => setSize(store.board.size));
	createSquares();
	setSize(store.board.size, true);
	setTimeout(resize, 1000); // This is needed on old Safari
}
