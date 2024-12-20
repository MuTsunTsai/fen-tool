import { getRenderSize, noEditing, state, status, store } from "app/store";
import { squares, toFEN, setSquare, pushState } from "./squares";
import { cnvMain, imgOverlay, cnvTemplate, cnvGhost, cnvTempGhost } from "app/meta/el";
import { drawTemplate, templateValues } from "app/view/render";
import { checkDragPrecondition, checkPromotion, confirmPromotion, makeMove, retroClick, sync } from "app/tools/play/play";
import { types } from "app/view/piece";
import { LABEL_MARGIN } from "app/meta/option";
import { env } from "app/meta/env";
import { animate } from "app/view/animation";
import { Popeye } from "app/tools/popeye/popeye";
import { BOARD_SIZE, TEMPLATE_SIZE } from "app/meta/constants";
import { Rotation, TemplateRow } from "app/meta/enum";
import { wrapEvent, getXY, getRotation, getDisplacement } from "./event";

import type { MixedEvent, FederatedEvent } from "./event";

const DRAG_THRESHOLD = 5;
const ROTATE_THRESHOLD = 10;
const TAP_THRESHOLD = 300;
const CLICK_THRESHOLD = 250;
const WHEEL_THRESHOLD = 50;

const startPt: IPoint = { x: 0, y: 0 };
const sq: IPoint = { x: 0, y: 0 };
let currentSq: HTMLInputElement | undefined;
let lastTap = 0, lastDown = 0;
let ghost: HTMLCanvasElement, draggingValue: string | undefined, fromIndex: number;
let path: null | IPoint[];
let lastWheel = performance.now();

export function initDrag(): void {
	imgOverlay.onmousedown = mouseDown;
	imgOverlay.ontouchstart = mouseDown;
	imgOverlay.ondragstart = e => e.preventDefault();
	imgOverlay.onwheel = wheel;
	cnvTemplate.onmousedown = mouseDown;
	cnvTemplate.ontouchstart = mouseDown;

	document.body.onmousedown = event => {
		if(!noEditing() && event.target != cnvTemplate && event.target != imgOverlay) cancelSelection();
	};
	document.body.onmousemove = mouseMove;
	document.body.ontouchmove = mouseMove;
	document.body.onmouseleave = mouseUp;
	document.body.onmouseup = mouseUp;
	document.body.ontouchend = mouseUp;
}

function mouseMove(event: MixedEvent): void {
	const ev = wrapEvent(event);
	if(status.dragging == "pending" && getDisplacement(ev, startPt) > DRAG_THRESHOLD) {
		lastDown = 0;
		if(draggingValue) {
			path = env.isTouch ? [] : null;
			dragStart(ev, currentSq);
		} else { status.dragging = false; }
	}
	if(status.dragging === true) {
		if(path) path.push({ x: ev.clientX, y: ev.clientY });
		dragMove(ev);
	}
}

function cancelSelection(): void {
	status.selection = null;
	drawTemplate([]);
}

function mouseUp(event: MixedEvent): void {
	handleDoubleTap(event);

	if(ghost) ghost.style.display = "none";
	const ev = wrapEvent(event);

	if(handleTap(ev) || state.popeye.playing || !status.dragging) return;
	status.dragging = false;

	if(!draggingValue) return;
	const { w, h } = store.board;
	const { x, y } = getXY(ev, cnvMain);
	const index = y * w + x;
	const inBoard = inRange(x, y, w, h);
	if(state.play.playing) {
		let result;
		if(inBoard) {
			if(checkPromotion(fromIndex, index)) return setSquare(squares[index], draggingValue);
			else if(fromIndex != index) result = makeMove(fromIndex, index);
		}
		if(typeof result == "object") animate(result.before, result.after, result.move);
		else sync();
	} else if(inBoard) {
		setSquare(squares[index], draggingValue);
		if(currentSq && path && path.length > ROTATE_THRESHOLD) { // Touch rotation
			rotate(currentSq, getRotation(path));
		}
	} else {
		pushState();
	}
}

function handleDoubleTap(event: MixedEvent): void {
	if(currentSq && status.dragging == "pending" && !state.play.playing && event.target == imgOverlay) {
		const now = performance.now();
		if(now - lastTap < TAP_THRESHOLD) currentSq.focus();
		lastTap = now;
		event.preventDefault(); // Prevent touchend triggering mouseup
		status.dragging = false;
	}
}

function handleTap(event: FederatedEvent): boolean {
	const now = performance.now();
	// In some touch device, a tap will be converted to a delayed up-down
	// with time difference up to about 220ms
	if(now - lastDown >= CLICK_THRESHOLD) return false;

	if(event.target == cnvTemplate && !noEditing()) {
		let { x, y } = getXY(event, cnvTemplate);
		if(status.hor) [x, y] = [y, x];
		if(inRange(x, y, TEMPLATE_SIZE, BOARD_SIZE)) {
			const v = templateValues[y * TEMPLATE_SIZE + x];
			if(status.selection == v) status.selection = null;
			else status.selection = v;
			drawTemplate([]);
		} else {
			cancelSelection();
		}
		status.dragging = false;
		return true;
	} else if(event.target == imgOverlay && state.popeye.playing) {
		const FILE_3RD = 3;
		const FILE_4TH = 4;
		const { x } = getXY(event, imgOverlay);
		if(x < FILE_3RD) Popeye.moveBy(-1);
		if(x > FILE_4TH) Popeye.moveBy(1);
		return true;
	}
	return false;
}

function wheel(event: WheelEvent): void {
	if(noEditing()) return;
	const { w, h } = store.board;
	const { offset, s } = getRenderSize();
	const x = Math.floor((event.offsetX - offset.x) / s);
	const y = Math.floor((event.offsetY - offset.y) / s);
	if(inRange(x, y, w, h)) {
		const square = squares[y * w + x];
		if(square.value == "") return;
		event.preventDefault();
		const now = performance.now();
		if(now - lastWheel < WHEEL_THRESHOLD) return; // throttle
		lastWheel = now;
		rotate(square, event.deltaY > 0 ? Rotation.r90 : Rotation.r270);
	}
}

function rotate(square: HTMLInputElement, by: number): void {
	// Lookbehind is not supported for Safari<16.4
	square.value = square.value.replace(/(^-?)(?:\*(\d))?([^-].*$)/, (_, a, b, c) => {
		const rotation = (Number(b || 0) + by) % Rotation.full;
		return a + (rotation ? "*" + rotation : "") + c;
	});
	toFEN();
}

function mouseDown(this: GlobalEventHandlers, event: MixedEvent): void {
	lastDown = performance.now();
	if(state.popeye.playing) return;
	if(status.loading ||
		event.button != 0 && !event.targetTouches ||
		event.targetTouches && event.targetTouches.length > 1) return;
	const ev = wrapEvent(event);

	if(document.activeElement) (document.activeElement as HTMLInputElement).blur();
	const isCN = this != cnvTemplate;
	const { offset, s } = isCN ? getRenderSize() : getRenderSize(cnvTemplate, status.hor);
	const { w, h } = store.board;
	startPt.x = ev.offsetX;
	startPt.y = ev.offsetY;
	const [ox, oy] = [offset.x, offset.y];
	sq.x = Math.floor((startPt.x - ox) / s);
	sq.y = Math.floor((startPt.y - oy) / s);
	const index = sq.y * (isCN ? w : TEMPLATE_SIZE) + sq.x;
	ghost = isCN ? cnvGhost : cnvTempGhost;

	const v = status.selection;
	if(isCN && v) return quickEdit(ev, w, h, v, index);

	if(state.play.playing) {
		if(!isCN) handleMouseDownInPlayMode(ev);
		if(!isCN || !checkDragPrecondition(index)) return;
	}

	if(isCN) {
		fromIndex = index;
		currentSq = squares[index];
		status.dragging = "pending";
		draggingValue = undefined;
	} else {
		currentSq = undefined;
	}
	if(!currentSq || currentSq.value != "") {
		handleGhost(ev, s, offset, index);
	}
}

function quickEdit(event: FederatedEvent, w: number, h: number, v: string, index: number): void {
	event.preventDefault();
	if(inRange(sq.x, sq.y, w, h)) {
		const square = squares[index];
		if(square.value == v) square.value = "";
		else square.value = v;
		toFEN();
	} else {
		cancelSelection();
	}
}

function handleMouseDownInPlayMode(event: FederatedEvent): void {
	if(state.play.pendingPromotion) {
		if(status.hor) [sq.x, sq.y] = [sq.y, sq.x];
		const x = draggingValue == "p" ? 0 : 1;
		if(sq.y > TemplateRow.k && sq.y < TemplateRow.p && sq.x == x) {
			confirmPromotion(fromIndex, types[sq.y]);
		}
	}
	if(state.play.mode == "retro") {
		event.preventDefault(); // Prevent touchstart triggering mousedown
		if(status.hor) [sq.x, sq.y] = [sq.y, sq.x];
		retroClick(sq.x, sq.y);
	}
}

function handleGhost(event: FederatedEvent, s: number, offset: IPoint, index: number): void {
	const [ox, oy] = [offset.x, offset.y];
	event.preventDefault();
	ghost.style.clip = `rect(${sq.y * s + oy + 1}px,${(sq.x + 1) * s + ox - 1}px,${(sq.y + 1) * s + oy - 1}px,${sq.x * s + ox + 1}px)`;
	if(currentSq) {
		draggingValue = currentSq.value;
	} else {
		draggingValue = status.hor ? templateValues[sq.x * TEMPLATE_SIZE + sq.y] : templateValues[index];
		status.dragging = "pending";
	}
}

function dragStart(event: FederatedEvent, square?: HTMLInputElement): void {
	cancelSelection();
	ghost.style.display = "block";
	if(square) {
		square.value = "";
		toFEN();
	}
	status.dragging = true;
	dragMove(event);
}

function dragMove(event: FederatedEvent): void {
	const { offset, s } = getRenderSize();
	const { w, h, coordinates } = store.board;
	const r = cnvMain.getBoundingClientRect();
	const left = ghost == cnvTempGhost && coordinates && !status.hor ? r.left + LABEL_MARGIN : r.left;
	const y = Math.floor((event.clientY - r.top - offset.y) / s);
	const x = Math.floor((event.clientX - r.left - offset.x) / s);
	if(x !== sq.x || y !== sq.y) path = null;
	const { scrollLeft, scrollTop } = document.documentElement;
	if(inRange(x, y, w, h)) {
		ghost.style.left = left + (x - sq.x) * s + scrollLeft + "px";
		ghost.style.top = r.top + (y - sq.y) * s + scrollTop + "px";
	} else {
		ghost.style.left = event.clientX + scrollLeft + 1 - startPt.x + "px";
		ghost.style.top = event.clientY + scrollTop - startPt.y + "px";
	}
}

function inRange(x: number, y: number, w: number, h: number): boolean {
	return y > -1 && y < h && x > -1 && x < w;
}
