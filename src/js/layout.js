import { CN, SN, CG, TP, TPG } from "./meta/el";
import { getRenderSize, store } from "./store";
import { drawTemplate, draw, load, drawEmpty } from "./render";
import { setSquareSize, createSquares, container, snapshot, paste, setFEN, pushState, toFEN } from "./squares";
import { BORDER, parseBorder } from "./meta/option";

export const mode = {
	hor: false,
	collapse: false,
	dragging: false,
};

const Zone = document.getElementById("Zone");
const DragZone = document.getElementById("DragZone");
const EditZone = document.getElementById("EditZone");

export async function setOption(o, force) {
	const options = store.board;
	const changed = {};
	for(const key in options) {
		changed[key] = o[key] !== undefined && o[key] !== options[key];
		if(changed[key]) options[key] = o[key];
		else o[key] = options[key];
	}
	const border = parseBorder(o.border);

	// Decide mode
	const rem = getREM();
	const newMode = document.body.clientWidth < (o.w + 3) * o.size + 4 * border.size + 2.1 * rem;
	changed.mode = newMode !== mode.hor;
	mode.hor = newMode;

	const dimChange = changed.w || changed.h;
	if(dimChange || force) createSquares();

	const shouldUpdateAsset = force || changed.set || changed.size;
	const shouldRedraw = shouldUpdateAsset || changed.border;
	const shouldDrawBoard = shouldRedraw || dimChange;
	const shouldDrawTemplate = shouldRedraw || changed.mode;

	if(shouldDrawBoard) {
		const bw = o.w * o.size + 2 * border.size;
		const bh = o.h * o.size + 2 * border.size;
		if(CN.width !== bw || CN.height !== bh) {
			SN.width = CG.width = CN.width = bw;
			SN.height = CG.height = CN.height = bh;
		}
		drawEmpty(SN.getContext("2d"));
	}

	if(shouldDrawTemplate) {
		let tw = 3 * o.size + 2 * border.size;
		let th = 8 * o.size + 2 * border.size;
		if(mode.hor) {
			[tw, th] = [th, tw];
			CN.parentNode.classList.add("mb-3");
			TP.classList.remove("ms-4");
		} else {
			CN.parentNode.classList.remove("mb-3");
			TP.classList.add("ms-4");
		}
		if(TP.width !== tw || TP.height !== th) {
			TPG.width = TP.width = tw;
			TPG.height = TP.height = th;
		}
	}

	resize();

	// Async parts
	if(shouldUpdateAsset) await load();
	if(shouldDrawBoard) draw();
	if(shouldDrawTemplate) drawTemplate();
}

function setDimension(dim) {
	const { w, h } = store.board;
	const shot = snapshot();
	setOption(dim);
	paste(shot, w, h);
}

function resize() {
	Zone.style.maxWidth = `calc(${document.body.clientWidth}px + 3rem)`;
	CN.style.width = TP.style.width = "unset";
	const { w } = store.board;
	const r = getRenderSize();
	if(w > 8 && mode.hor) {
		const { b, s } = r;
		TP.style.width = 8 * s + 2 * b + "px";
	} else if(w < 8 && mode.hor) {
		const { b, s } = getRenderSize(TP);
		CN.style.width = w * s + 2 * b + "px";
	}
	container.style.borderWidth = r.b + "px";

	CG.style.width = CN.clientWidth + "px";
	CG.style.height = CN.clientHeight + "px";
	TPG.style.width = TP.clientWidth + "px";
	TPG.style.height = TP.clientHeight + "px";

	setSquareSize(r.s);

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

export async function initLayout() {
	window.addEventListener("resize", () => setOption({}));
	const url = new URL(location.href);
	const fen = url.searchParams.get("fen");
	await setOption({}, true);
	addEventListener("fen", draw);
	if(fen) {
		setFEN(fen, true);
		pushState();
	} else {
		toFEN();
	}
	setTimeout(resize, 1000); // This is needed on old Safari
}

window.Layout = {
	setOption,
	setDimension,
	setBorder(el) {
		if(!el.value.match(BORDER)) {
			el.value = store.board.border;
		} else {
			setOption({ border: el.value });
		}
	},
	setHeight(el) {
		if(typeof el == "number") {
			setDimension({ h: store.board.h + el });
		} else {
			const v = Math.floor(Number(el.value));
			if(isNaN(v) || v <= 0) {
				el.value = store.board.h;
			} else {
				setDimension({ h: v });
			}
		}
	},
	setWidth(el) {
		if(typeof el == "number") {
			setDimension({ w: store.board.w + el });
		} else {
			const v = Math.floor(Number(el.value));
			if(isNaN(v) || v <= 0) {
				el.value = store.board.w;
			} else {
				setDimension({ w: v });
			}
		}
	},
};