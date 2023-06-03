import { background } from "./draw";
import { FEN } from "./el";
import { DEFAULT, inferDimension, makeFEN, normalize, parseFEN } from "./fen.mjs";
import { setOption } from "./layout";
import { store, getRenderSize } from "./store";

export const squares = new Array(64);
export const container = document.getElementById("Squares");

export function setSquareSize() {
	const { s } = getRenderSize();
	const { w, h } = store.board;
	container.style.width = CN.clientWidth + "px";
	container.style.height = CN.clientHeight + "px";
	for(let i = 0; i < w * h; i++) {
		squares[i].style.fontSize = (s - 10) + "px";
		squares[i].style.lineHeight = (s - 10) + "px";
	}
}

window.setSquareSize = setSquareSize;

export function createSquares() {
	const { w, h } = store.board;
	const total = w * h;
	container.style.gridTemplateColumns = `repeat(${w}, 1fr)`;
	container.style.gridTemplateRows = `repeat(${h}, 1fr)`;
	for(let i = 0; i < total || i < squares.length; i++) {
		if(!squares[i]) {
			const sq = document.createElement("input");
			squares[i] = sq;
			sq.type = "text";
			sq.onchange = checkInput;
			sq.onfocus = squareOnFocus;
			sq.onblur = squareOnBlur;
			sq.classList.add("square");
			container.appendChild(sq);
		}
		squares[i].style.display = i < total ? "block" : "none";
	}
	setSquareBG();
}

export function setSquareBG() {
	const { pattern, bg, w, h } = store.board;
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			const s = squares[i * w + j];
			const bgc = background(pattern, i, j);
			if(bg == "gray") {
				s.style.background = bgc ? "#fff" : "#bbb";
			} else {
				s.style.background = bgc ? "#FFCE9E" : "#D18B47";
			}
		}
	}
}

function squareOnFocus() { this.select(); }
function squareOnBlur() { this.style.zIndex = "unset"; }

function checkInput() {
	checkInputCore(this);
	toFEN();
}

function checkInputCore(s) {
	let v = normalize(s.value, store.board.SN);
	const changed = v !== s.value;
	s.value = v;
	return changed;
}

export function setSquare(sq, value) {
	const updated = sq.value !== value;
	sq.value = value;
	checkInputCore(sq); // Needed for "S for knight"
	if(updated) toFEN();
}

window.empty = function() {
	for(const sq of squares) sq.value = "";
	toFEN();
}
window.reset = function() {
	setOption({ w: 8, h: 8 });
	setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
}

export function setFEN(v, check) {
	FEN.value = v;
	toSquares(check);
}

export function loadState(init) {
	const url = new URL(location.href);
	const fen = url.searchParams.get("fen");
	if(!init || fen) setFEN(fen || DEFAULT, true);
}
addEventListener("popstate", loadState);

export function pushState() {
	const current = location.search;
	const url = FEN.value == DEFAULT ? "" : "?fen=" + FEN.value;
	if(url !== decodeURIComponent(current)) {
		history.pushState(null, "", url || ".");
	}
}

export function snapshot() {
	return squares.map(s => s.value);
}

export function paste(shot, ow, oh) {
	const { w, h } = store.board;
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			const sq = squares[i * w + j];
			if(i < oh && j < ow) sq.value = shot[i * ow + j];
			else sq.value = "";
		}
	}
	toFEN();
}

export function toFEN() {
	const { w, h } = store.board;
	FEN.value = makeFEN(snapshot(), w, h);
	dispatchEvent(new Event("fen"));
}

function toSquares(check) {
	const infer = inferDimension(FEN.value);
	const { w, h } = infer || store.board;
	const values = parseFEN(FEN.value, w, h);
	setOption({ w, h });
	let changed = false;
	for(let i = 0; i < w * h; i++) {
		squares[i].value = values[i];
		changed = checkInputCore(squares[i]) || changed; // order matters
	}
	if(changed || check || !infer) toFEN();
	else dispatchEvent(new Event("fen"));
}

window.toSquares = toSquares;

export function updateSN() {
	let changed = false;
	for(const s of squares) changed = checkInputCore(s) || changed; // order matters
	if(changed) toFEN();
}

window.copyFEN = function() {
	gtag("event", "fen_copy");
	navigator.clipboard.writeText(FEN.value);
}

window.pasteFEN = async function() {
	gtag("event", "fen_paste");
	FEN.value = await navigator.clipboard.readText();
	toSquares(true);
}