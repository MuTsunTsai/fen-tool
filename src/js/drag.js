import { getRenderSize, noEditing, state, status, store } from "./store";
import { squares, toFEN, setSquare, pushState } from "./squares";
import { CN, PV, TP, CG, TPG } from "./meta/el";
import { drawTemplate, templateValues } from "./render";
import { checkDragPrecondition, checkPromotion, confirmPromotion, move, retroClick, sync } from "./tools/play";
import { types } from "./draw";
import { LABEL_MARGIN } from "./meta/option";
import { env } from "./meta/env";
import { animate } from "./animation";
import { Popeye } from "./tools/popeye";

let startX, startY, sqX, sqY, sq, lastTap = 0, lastDown;
let ghost, draggingValue, fromIndex;
let path;

export function initDrag() {
	PV.onmousedown = mouseDown;
	PV.ontouchstart = mouseDown;
	PV.ondragstart = e => e.preventDefault();
	PV.onwheel = wheel;
	TP.onmousedown = mouseDown;
	TP.ontouchstart = mouseDown;

	document.body.onmousedown = event => {
		if(!noEditing() && event.target != TP && event.target != PV) cancelSelection();
	};
	document.body.onmousemove = mousemove;
	document.body.ontouchmove = mousemove;
	document.body.onmouseleave = mouseup;
	document.body.onmouseup = mouseup;
	document.body.ontouchend = mouseup;
}

function mousemove(event) {
	wrapEvent(event);
	if(status.dragging == "pending" && getDisplacement(event) > 5) {
		lastDown = NaN;
		if(draggingValue) {
			path = env.isTouch ? [] : null;
			dragStart(event, Boolean(sq));
		} else status.dragging = false;
	}
	if(status.dragging === true) {
		if(path) path.push({ x: event.clientX, y: event.clientY });
		dragMove(event);
	}
}

function getXY(event, canvas) {
	const { s, offset } = getRenderSize();
	const r = canvas.getBoundingClientRect();
	const y = Math.floor((event.clientY - r.top - offset.y) / s);
	const x = Math.floor((event.clientX - r.left - offset.x) / s);
	return { x, y };
}

function cancelSelection() {
	status.selection = null;
	drawTemplate([]);
}

function mouseup(event) {
	if(status.dragging == "pending" && !state.play.playing && event.target == PV) {
		const now = performance.now();
		if(now - lastTap < 300) sq.focus();
		lastTap = now;
		event.preventDefault(); // Prevent touchend triggering mouseup
		status.dragging = false;
	}

	if(ghost) ghost.style.display = "none";
	wrapEvent(event);

	const now = performance.now();
	// In some touch device, a tap will be converted to a delayed up-down
	// with time difference up to about 220ms
	if(now - lastDown < 250) {
		if(event.target == TP && !noEditing()) {
			let { x, y } = getXY(event, TP);
			if(status.hor) [x, y] = [y, x];
			if(inRange(x, y, 3, 8)) {
				const v = templateValues[y * 3 + x];
				if(status.selection == v) status.selection = null;
				else status.selection = v;
				drawTemplate([]);
			} else {
				cancelSelection();
			}
			status.dragging = false;
			return;
		} else if(event.target == PV && state.popeye.playing) {
			const { x } = getXY(event, PV);
			if(x < 3) Popeye.moveBy(-1);
			if(x > 4) Popeye.moveBy(1);
			return;
		}
	}

	if(state.popeye.playing || !status.dragging) return;
	status.dragging = false;

	if(!draggingValue) return;
	const { w, h } = store.board;
	const { x, y } = getXY(event, CN);
	const index = y * w + x;
	const inBoard = inRange(x, y, w, h);
	if(state.play.playing) {
		let result;
		if(inBoard) {
			if(checkPromotion(fromIndex, index)) return setSquare(squares[index], draggingValue);
			else if(fromIndex != index) result = move(fromIndex, index);
		}
		if(typeof result == "object") animate(result.before, result.after, result.move);
		else sync();
	} else if(inBoard) {
		setSquare(squares[index], draggingValue);
		if(path && path.length > 10) { // Touch rotation
			const center = getCenter(path);
			const wn = windingNumber(center, path);
			rotate(sq, wn > 0 ? 1 : 3);
		}
	} else {
		pushState();
	}
}

function getCenter(points) {
	let x = 0, y = 0;
	for(const point of points) {
		x += point.x;
		y += point.y;
	}
	x /= points.length;
	y /= points.length;
	return { x, y };
}

function windingNumber(center, points) {
	let wn = 0;
	for(let i = 0, j = points.length - 1; i < points.length; j = i++) {
		const pi = points[i], pj = points[j];
		if(pj.y <= center.y) {
			if(pi.y > center.y) {
				if(isLeft(pj, pi, center) > 0) wn++;
			}
		} else {
			if(pi.y <= center.y) {
				if(isLeft(pj, pi, center) < 0) wn--;
			}
		}
	}
	return wn;
};

function isLeft(P0, P1, P2) {
	let res = ((P1.x - P0.x) * (P2.y - P0.y)
		- (P2.x - P0.x) * (P1.y - P0.y));
	return res;
}

let lastWheel = performance.now();

function wheel(event) {
	if(noEditing()) return;
	const { w, h } = store.board;
	const { offset, s } = getRenderSize();
	const x = Math.floor((event.offsetX - offset.x) / s);
	const y = Math.floor((event.offsetY - offset.y) / s);
	if(inRange(x, y, w, h)) {
		const sq = squares[y * w + x];
		if(sq.value == "") return;
		event.preventDefault();
		const now = performance.now();
		if(now - lastWheel < 50) return; // throttle
		lastWheel = now;
		rotate(sq, event.deltaY > 0 ? 1 : 3);
	}
}

function rotate(sq, by) {
	// Lookbehind is not supported for Safari<16.4
	sq.value = sq.value.replace(/(^-?)(?:\*(\d))?([^-].*$)/, (_, a, b, c) => {
		const rotation = (Number(b || 0) + by) % 4;
		return a + (rotation ? "*" + rotation : "") + c;
	});
	toFEN();
}

function mouseDown(event) {
	lastDown = performance.now();
	if(state.popeye.playing) return;
	if(status.loading || event.button != 0 && !event.targetTouches || event.targetTouches && event.targetTouches.length > 1) return;
	wrapEvent(event);

	if(document.activeElement) document.activeElement.blur();
	const isCN = this != TP;
	const { offset, s } = isCN ? getRenderSize() : getRenderSize(TP, status.hor);
	const { w, h } = store.board;
	startX = event.offsetX;
	startY = event.offsetY;
	const [ox, oy] = [offset.x, offset.y];
	sqX = Math.floor((startX - ox) / s);
	sqY = Math.floor((startY - oy) / s);
	const index = sqY * (isCN ? w : 3) + sqX;
	ghost = isCN ? CG : TPG;

	const v = status.selection;
	if(isCN && v) {
		event.preventDefault();
		if(inRange(sqX, sqY, w, h)) {
			const sq = squares[index];
			if(sq.value == v) sq.value = "";
			else sq.value = v;
			toFEN();
		} else {
			cancelSelection();
		}
		return;
	}

	if(state.play.playing) {
		if(!isCN && state.play.pendingPromotion) {
			if(status.hor) [sqX, sqY] = [sqY, sqX];
			const x = draggingValue == "p" ? 0 : 1;
			if(sqY > 0 && sqY < 5 && sqX == x) confirmPromotion(fromIndex, types[sqY]);
		}
		if(!isCN && state.play.mode == "retro") {
			event.preventDefault(); // Prevent touchstart triggering mousedown
			if(status.hor) [sqX, sqY] = [sqY, sqX];
			retroClick(sqX, sqY);
		}
		if(!isCN || !checkDragPrecondition(index)) return;
	}

	if(isCN) {
		fromIndex = index;
		sq = squares[index];
		status.dragging = "pending";
		draggingValue = undefined;
	} else {
		sq = undefined;
	}
	if(!isCN || sq.value != "") {
		event.preventDefault();
		ghost.style.clip = `rect(${sqY * s + oy + 1}px,${(sqX + 1) * s + ox - 1}px,${(sqY + 1) * s + oy - 1}px,${sqX * s + ox + 1}px)`;
		if(isCN) {
			draggingValue = sq.value;
		} else {
			draggingValue = status.hor ? templateValues[sqX * 3 + sqY] : templateValues[index];
			status.dragging = "pending";
		}
	}
}

function dragStart(event, isCN) {
	cancelSelection();
	ghost.style.display = "block";
	if(isCN) {
		sq.value = "";
		toFEN();
	}
	status.dragging = true;
	dragMove(event);
}

function getDisplacement(event) {
	const dx = event.offsetX - startX;
	const dy = event.offsetY - startY;
	const result = Math.sqrt(dx * dx + dy * dy);
	return result;
}

function dragMove(event) {
	const { offset, s } = getRenderSize();
	const { w, h, coordinates } = store.board;
	const r = CN.getBoundingClientRect();
	const left = ghost == TPG && coordinates && !status.hor ? r.left + LABEL_MARGIN : r.left;
	const y = Math.floor((event.clientY - r.top - offset.y) / s);
	const x = Math.floor((event.clientX - r.left - offset.x) / s);
	if(x !== sqX || y !== sqY) path = null;
	const { scrollLeft, scrollTop } = document.documentElement;
	if(inRange(x, y, w, h)) {
		ghost.style.left = left + (x - sqX) * s + scrollLeft + "px";
		ghost.style.top = r.top + (y - sqY) * s + scrollTop + "px";
	} else {
		ghost.style.left = event.clientX + scrollLeft + 1 - startX + "px";
		ghost.style.top = event.clientY + scrollTop - startY + "px";
	}
}

function inRange(x, y, w, h) {
	return y > -1 && y < h && x > -1 && x < w;
}

function wrapEvent(event) {
	if(event.targetTouches) {
		const bcr = event.target.getBoundingClientRect();
		const touch = event.targetTouches[0] || event.changedTouches[0];
		event.clientX = touch.clientX;
		event.clientY = touch.clientY;
		event.offsetX = event.clientX - bcr.x;
		event.offsetY = event.clientY - bcr.y;
	}
}