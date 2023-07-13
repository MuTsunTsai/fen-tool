import { mode } from "./layout";
import { getRenderSize, state, store } from "./store";
import { squares, toFEN, setSquare, pushState } from "./squares";
import { CN, PV, TP } from "./meta/el";
import { templateValues } from "./render";
import { checkDragPrecondition, checkPromotion, confirmPromotion, move, retroClick, sync } from "./tools/play";
import { types } from "./draw";

let startX, startY, sqX, sqY, sq, lastTap = 0;
let ghost, draggingValue, fromIndex;

export function initDrag() {
	PV.onmousedown = mouseDown;
	PV.ontouchstart = mouseDown;
	PV.ondragstart = e => e.preventDefault();
	TP.onmousedown = mouseDown;
	TP.ontouchstart = mouseDown;

	document.body.onmousemove = mousemove;
	document.body.ontouchmove = mousemove;
	document.body.onmouseleave = mouseup;
	document.body.onmouseup = mouseup;
	document.body.ontouchend = mouseup;
}

function mousemove(event) {
	wrapEvent(event);
	if(mode.dragging == "pending" && getDisplacement(event) > 5) {
		if(draggingValue) dragStart(event, true);
		else mode.dragging = false;
	}
	if(mode.dragging === true) dragMove(event);
}

function mouseup(event) {
	if(mode.dragging == "pending" && !state.play.playing) {
		const now = performance.now();
		if(now - lastTap < 300) sq.focus();
		lastTap = now;
		event.preventDefault(); // Prevent touchend triggering mouseup
		mode.dragging = false;
	}

	if(!mode.dragging) return;
	mode.dragging = false;
	if(!draggingValue) return;
	wrapEvent(event);
	const { w, h } = store.board;
	const { b, s } = getRenderSize();
	const r = CN.getBoundingClientRect();
	const y = Math.floor((event.clientY - r.top - b) / s);
	const x = Math.floor((event.clientX - r.left - b) / s);
	const index = y * w + x;
	ghost.style.display = "none";
	const inBoard = y > -1 && y < h && x > -1 && x < w;
	if(state.play.playing) {
		if(inBoard) {
			if(checkPromotion(fromIndex, index)) return setSquare(squares[index], draggingValue);
			else if(fromIndex != index) move(fromIndex, index);
		}
		sync();
	} else if(inBoard) {
		setSquare(squares[index], draggingValue);
	} else {
		pushState();
	}
}

function mouseDown(event) {
	if(state.loading || event.button != 0 && !event.targetTouches || event.targetTouches && event.targetTouches.length > 1) return;
	wrapEvent(event);

	if(document.activeElement) document.activeElement.blur();
	const { b, s } = getRenderSize();
	const { w } = store.board;
	const isCN = this != TP;
	startX = event.offsetX;
	startY = event.offsetY;
	sqX = Math.floor((startX - b) / s);
	sqY = Math.floor((startY - b) / s);
	const index = sqY * (isCN ? w : 3) + sqX;
	ghost = document.getElementById(isCN ? "CanvasGhost" : "TemplateGhost");

	if(state.play.playing) {
		if(!isCN && state.play.pendingPromotion) {
			if(mode.hor) [sqX, sqY] = [sqY, sqX];
			const x = draggingValue == "p" ? 0 : 1;
			if(sqY > 0 && sqY < 5 && sqX == x) confirmPromotion(fromIndex, types[sqY]);
		}
		if(!isCN && state.play.mode == "retro") {
			if(mode.hor) [sqX, sqY] = [sqY, sqX];
			retroClick(sqX, sqY);
		}
		if(!isCN || !checkDragPrecondition(index)) return;
	}

	if(isCN) {
		fromIndex = index;
		sq = squares[index];
		mode.dragging = "pending";
		draggingValue = undefined;
	}
	if(!isCN || sq.value != "") {
		event.preventDefault();
		ghost.style.clip = `rect(${sqY * s + b + 1}px,${(sqX + 1) * s + b - 1}px,${(sqY + 1) * s + b - 1}px,${sqX * s + b + 1}px)`;
		if(isCN) {
			draggingValue = sq.value;
		} else {
			draggingValue = mode.hor ? templateValues[sqX * 3 + sqY] : templateValues[index];
			dragStart(event)
		}
	}
}

function dragStart(event, isCN) {
	ghost.style.display = "block";
	if(isCN) {
		sq.value = "";
		toFEN();
	}
	mode.dragging = true;
	dragMove(event);
}

function getDisplacement(event) {
	const dx = event.offsetX - startX;
	const dy = event.offsetY - startY;
	const result = Math.sqrt(dx * dx + dy * dy);
	return result;
}

function dragMove(event) {
	const { b, s } = getRenderSize();
	const { w, h } = store.board;
	const r = CN.getBoundingClientRect();
	const y = Math.floor((event.clientY - r.top - b) / s);
	const x = Math.floor((event.clientX - r.left - b) / s);
	const { scrollLeft, scrollTop } = document.documentElement;
	if(y > -1 && y < h && x > -1 && x < w) {
		ghost.style.left = r.left + (x - sqX) * s + scrollLeft + "px";
		ghost.style.top = r.top + (y - sqY) * s + scrollTop + "px";
	} else {
		ghost.style.left = event.clientX + scrollLeft + 1 - startX + "px";
		ghost.style.top = event.clientY + scrollTop - startY + "px";
	}
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