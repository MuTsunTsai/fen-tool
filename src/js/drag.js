import { mode } from "./layout";
import { state } from "./store";
import { squares, toFEN } from "./squares";
import { CN, TP, realSize } from "./el";

const templateValues = "k,K,-k,q,Q,-q,b,B,-b,n,N,-n,r,R,-r,p,P,-p,c,C,-c,x,X,-x".split(",");
let startX, startY, sqX, sqY, sq, lastTap = 0;
let ghost, draggingValue, offset;

export function setupDrag() {
	CN.onmousedown = mouseDown;
	CN.ontouchstart = mouseDown;
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
	if(mode.collapse && mode.dragging == "pending") {
		const now = performance.now();
		if(now - lastTap < 300) {
			sq.style.zIndex = "10";
			sq.focus();
		}
		lastTap = now;
		event.preventDefault(); // Prevent touchend triggering mouseup
		mode.dragging = false;
	}

	if(!mode.dragging) return;
	mode.dragging = false;
	if(!draggingValue) return;
	wrapEvent(event);
	const size = realSize();
	const r = CN.getBoundingClientRect();
	const y = Math.floor((event.clientY - r.top - 1) / size);
	const x = Math.floor((event.clientX - r.left - 1) / size);
	const index = y * 8 + x;
	ghost.style.display = "none";
	if(y > -1 && y < 8 && x > -1 && x < 8) {
		const updated = squares[index].value !== draggingValue;
		squares[index].value = draggingValue;
		if(updated) toFEN();
	}
}

function mouseDown(event) {
	if(state.loading || event.button != 0 && !event.targetTouches || event.targetTouches && event.targetTouches.length > 1) return;
	wrapEvent(event);

	if(document.activeElement) document.activeElement.blur();
	const size = realSize();
	const isCN = this == CN;
	startX = event.offsetX;
	startY = event.offsetY;
	sqX = Math.floor((startX - 1) / size);
	sqY = Math.floor((startY - 1) / size);
	const index = sqY * (isCN ? 8 : 3) + sqX;
	ghost = document.getElementById(isCN ? "CanvasGhost" : "TemplateGhost");
	if(isCN) {
		sq = squares[index];
		mode.dragging = "pending";
		draggingValue = undefined;
	}
	if(!isCN || sq.value != "") {
		event.preventDefault();
		ghost.style.clip = `rect(${2 + sqY * size}px,${(sqX + 1) * size}px,${(sqY + 1) * size}px,${2 + sqX * size}px)`;
		offset = isCN ? 0 : 1;
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
	const size = realSize();
	const r = CN.getBoundingClientRect();
	const y = Math.floor((event.clientY - r.top - 1) / size);
	const x = Math.floor((event.clientX - r.left - 1) / size);
	const { scrollLeft, scrollTop } = document.documentElement;
	if(y > -1 && y < 8 && x > -1 && x < 8) {
		ghost.style.left = r.left + (x - sqX) * size + offset + scrollLeft + "px";
		ghost.style.top = r.top + (y - sqY) * size + offset + scrollTop + "px";
	} else {
		ghost.style.left = event.clientX + scrollLeft - startX + "px";
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