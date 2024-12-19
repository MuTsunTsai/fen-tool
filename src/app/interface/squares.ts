import { shallowRef } from "vue";

import { cnvMain } from "app/meta/el";
import { DEFAULT, INIT_FORSYTH, convertSN, inferDimension, invert, makeForsyth, normalize, normalizeSpaceRepresentation, parseFEN } from "app/meta/fen";
import { state, status, store } from "app/store";
import { animate, animeSettings } from "app/view/animation";
import { BOARD_SIZE, INIT_SQ_COUNT } from "app/meta/constants";
import { Color } from "app/meta/enum";

import type { BoardOptions } from "app/meta/option";

type CastlingRightsKeys = "K" | "Q" | "k" | "q";

const castlingKeys: CastlingRightsKeys[] = ["K", "Q", "k", "q"];

export const squares = new Array<HTMLInputElement>(INIT_SQ_COUNT);
export const container = document.getElementById("Squares") as HTMLDivElement;

export const callback = {} as {
	draw: (data: Board) => void;
	setOption: (options: Partial<BoardOptions>) => void;
};

const FONT_MARGIN = 10;

export const currentFEN = shallowRef("");

animeSettings.options = store.board;
animeSettings.callback = setFEN;

function draw(data: Board): void {
	callback.draw?.(data);
}

export function setSquareSize(size: number): void {
	container.style.width = cnvMain.clientWidth + "px";
	container.style.height = cnvMain.clientHeight + "px";
	for(const sq of squares) {
		sq.style.fontSize = size - FONT_MARGIN + "px";
		sq.style.lineHeight = size - FONT_MARGIN + "px";
	}
}

export function createSquares(): void {
	const { w, h } = store.board;
	const total = w * h;
	container.style.gridTemplateColumns = `repeat(${w}, 1fr)`;
	container.style.gridTemplateRows = `repeat(${h}, 1fr)`;
	for(let i = 0; i < total || i < squares.length; i++) {
		if(!squares[i]) {
			const sq = document.createElement("input");
			squares[i] = sq;
			sq.type = "text";
			sq.addEventListener("input", onInput);
			sq.addEventListener("change", onChange);
			sq.addEventListener("focus", onFocus);
			sq.addEventListener("blur", onBlur);
			sq.classList.add("square");
			container.appendChild(sq);
		}
		squares[i].style.display = i < total ? "block" : "none";
	}
}

function onFocus(this: HTMLInputElement): void {
	this.style.zIndex = "10";
	if(status.collapse) {
		// In collapse mode, redraw the board but keep the current square empty
		const data = createSnapshot();
		data[squares.indexOf(this)] = "";
		draw(data);
	}
	this.select();
}
function onBlur(this: HTMLInputElement): void {
	this.style.zIndex = "unset";
	// We check the input again on blur, as some browser extensions could
	// programmatically modify its value without triggering onchange event.
	if(checkInput(this)) {
		toFEN();
	} else if(status.collapse) {
		draw(createSnapshot()); // restore board drawing
	}
}

function onChange(this: HTMLInputElement): void {
	checkInput(this);
	if(status.collapse) this.blur();
	toFEN();
}

function onInput(this: HTMLInputElement): void {
	if(!status.collapse) {
		const data = createSnapshot();
		data[squares.indexOf(this)] = normalize(this.value, store.board.SN);
		draw(data);
	}
}

function checkInput(s: HTMLInputElement, convert?: boolean): boolean {
	const v = normalize(s.value, store.board.SN, convert);
	const changed = v !== s.value;
	s.value = v;
	return changed;
}

export function setSquare(sq: HTMLInputElement, value: string): void {
	const updated = sq.value !== value;
	sq.value = value;
	checkInput(sq); // Needed for "S for knight"
	if(updated) toFEN();
}

export function setFEN(fen: string, check?: boolean): void {
	const arr = parseEdwards(fen);
	currentFEN.value = arr[0] + (store.board.fullFEN ? edwards() : "");
	toSquares(check);
}

function parseEdwards(ed: string): string[] {
	const arr = ed.split(" ");
	if(arr[1] && arr[1].match(/^[wb]$/)) state.play.turn = arr[1];
	if(arr[2] && arr[2].match(/^(-|[kq]+)$/i)) {
		for(const key in state.play.castle) {
			state.play.castle[key as CastlingRightsKeys] = arr[2].includes(key);
		}
	}
	if(arr[3] && arr[3].match(/^[a-h][36]$/)) state.play.enPassant = arr[3];
	if(arr[4] && arr[4].match(/^\d+$/)) state.play.halfMove = Number(arr[4]);
	if(arr[5] && arr[5].match(/^\d+$/)) state.play.fullMove = Number(arr[5]);
	return arr;
}

function loadState(): void {
	if(state.play.playing) return;
	const url = new URL(location.href);
	const fen = url.searchParams.get("fen");
	if(fen) setFEN(fen, true);
}
addEventListener("popstate", loadState);

export function pushState(): void {
	const current = new URL(location.href).searchParams.get("fen") || DEFAULT;
	const forsyth = currentFEN.value.split(" ")[0];
	const url = forsyth == DEFAULT ? "" : "?fen=" + encodeURIComponent(forsyth);
	if(forsyth !== current) {
		history.pushState(null, "", url || ".");
	}
}

export function createSnapshot(): Board {
	const { w, h } = store.board;
	const total = w * h;
	return squares.slice(0, total).map(s => s.value);
}

export function createNormalSnapshot(): Board {
	return createSnapshot().map(v => convertSN(v, false, true));
}

export function paste(snapshot: Board, ow: number, oh: number): void {
	const { w, h } = store.board;
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			const sq = squares[i * w + j];
			if(i < oh && j < ow) sq.value = snapshot[i * ow + j];
			else sq.value = "";
		}
	}
	toFEN();
}

export function toFEN(): void {
	const data = updateEdwards();
	draw(data);
}

export function updateEdwards(): Board {
	const { w, h, fullFEN } = store.board;
	const data = createSnapshot();
	currentFEN.value = makeForsyth(data, w, h) + (fullFEN ? edwards() : "");
	return data;
}

function orthodoxForsyth(): string | null {
	const { w, h } = store.board;
	if(w != BOARD_SIZE || h != BOARD_SIZE) return null;
	const ss = createNormalSnapshot();
	for(const s of ss) {
		if(s != "" && !s.match(/^[kqbsnrp]$/i)) return null;
	}
	return makeForsyth(ss);
}

export function orthodoxFEN(): string | null {
	const forsyth = orthodoxForsyth();
	if(!forsyth) return null;
	return forsyth + edwards(true);
}

function edwards(check?: boolean): string {
	const p = state.play;

	if(!p.enPassant.match(/^[a-h][36]$/)) p.enPassant = ""; // Ignore invalid squares
	if(check && p.mode == "pass" && p.enPassant && p.enPassant[1] == "3" != (p.turn == "b")) {
		// In passing mode, auto-correct the turn if ep is given
		p.turn = p.turn == "b" ? "w" : "b";
	}

	const isRetro = p.mode == "retro";
	if(check) {
		if(isRetro || !Number.isSafeInteger(p.halfMove) || p.halfMove < 0) p.halfMove = 0;
		if(isRetro || !Number.isSafeInteger(p.fullMove) || p.fullMove < 1) p.fullMove = 1;
	}

	const castle = isRetro ? "-" : getCastle(check);
	const ep = isRetro ? "-" : p.enPassant || "-";
	return ` ${p.turn} ${castle} ${ep} ${p.halfMove} ${p.fullMove}`;
}

function getCastle(check?: boolean): string {
	const ss = createSnapshot();
	let result = "";
	const c = state.play.castle;
	if(check) {
		// Chess.js doesn't really check if the castling parameters make sense;
		// so we have to double check the parameters here.
		// TODO: support Chess960 here
		if(ss[60] == "K") {
			if(c.K && ss[63] == "R") result += "K";
			if(c.Q && ss[56] == "R") result += "Q";
		}
		if(ss[4] == "k") {
			if(c.k && ss[7] == "r") result += "k";
			if(c.q && ss[0] == "r") result += "q";
		}
	} else {
		if(c.K) result += "K";
		if(c.Q) result += "Q";
		if(c.k) result += "k";
		if(c.q) result += "q";
	}
	return result == "" ? "-" : result;
}

function toSquares(check?: boolean): void {
	const rawFEN = currentFEN.value;
	parseFullFEN(rawFEN);
	const fen = normalizeSpaceRepresentation(rawFEN);
	const infer = inferDimension(fen);
	const { w, h } = infer || store.board;
	const values = parseFEN(fen, w, h);
	callback.setOption?.({ w, h });
	let changed = fen != rawFEN;
	for(let i = 0; i < w * h; i++) {
		squares[i].value = values[i];
		changed = checkInput(squares[i]) || changed; // order matters
	}
	if(changed || check || !infer) toFEN();
	else draw(createSnapshot());
}

export function parseFullFEN(fen: string): void {
	const s = state.play;
	const arr = fen.split(" ");
	if(arr.length == 1) return;
	if(arr[1] == "w" || arr[1] == "b") s.turn = arr[1];
	if(arr[2]) {
		for(const key of castlingKeys) s.castle[key] = arr[2].includes(key);
	}
	s.enPassant = !arr[3] || arr[3] == "-" ? "" : arr[3];
	if(s.mode != "retro") {
		s.halfMove = Number(arr[4] || 0);
		s.fullMove = Number(arr[5] || 1);
	}
}

export function updateSN(): void {
	let changed = false;
	for(const s of squares) changed = checkInput(s, true) || changed; // order matters
	if(changed) toFEN();
}

export function toggleReadOnly(readOnly: boolean): void {
	for(const s of squares) s.readOnly = readOnly;
}

export function replace(board: Board): void {
	if(board.anime) {
		const fen = makeForsyth(board, store.board.w, store.board.h);
		animate(currentFEN.value, fen, board.anime);
	} else {
		board.forEach((v, i) => squares[i].value = v);
		toFEN();
	}
}

export function resetEdwards(): void {
	Object.assign(state.play, {
		turn: Color.white,
		enPassant: "",
		halfMove: 0,
		fullMove: 1,
	});
	for(const key of castlingKeys) state.play.castle[key] = true;
}

export const FEN = {
	update: () => {
		parseEdwards(currentFEN.value);
		toSquares(true);
	},
	empty() {
		for(const sq of squares) sq.value = "";
		toFEN();
	},
	reset(ed?: boolean) {
		callback.setOption?.({ w: 8, h: 8 });
		if(store.board.fullFEN || ed) resetEdwards();
		setFEN(INIT_FORSYTH);
	},
	color(c: number) {
		for(const sq of squares) {
			let s = sq.value;
			if(s.startsWith("'") || s == "") continue;
			if(s.startsWith("-")) s = s.substr(1);
			s = s.toLowerCase();
			if(c == 0) s = "-" + s;
			if(c == 1) s = s.toUpperCase();
			sq.value = s;
		}
		toFEN();
	},
	fixSN() {
		gtag("event", "fen_fix_sn");
		for(const sq of squares) {
			const s = sq.value;
			if(s.startsWith("'") || s == "") continue;
			sq.value = s.replace("s", "n").replace("S", "N");
		}
		toFEN();
	},
	invert(l?: boolean) {
		replace(invert(createSnapshot(), l));
	},
};
