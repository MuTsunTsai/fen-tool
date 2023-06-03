import { background } from "./draw";
import { FEN } from "./el";
import { makeFEN, normalize, parseFEN } from "./fen.mjs";
import { store, getRenderSize } from "./store";

export const squares = new Array(64);
export const container = document.getElementById("Squares");

export function setSquareSize() {
	const { s } = getRenderSize();
	container.style.width = CN.clientWidth + "px";
	container.style.height = CN.clientHeight + "px";
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			squares[i * 8 + j].style.fontSize = (s - 10) + "px";
			squares[i * 8 + j].style.lineHeight = (s - 10) + "px";
		}
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
	loadState();
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

export function setFEN(v, check) {
	FEN.value = v;
	toSquares(check);
}
window.setFEN = setFEN;

function loadState() {
	const url = new URL(location.href);
	const fen = url.searchParams.get("fen");
	if(fen) setFEN(fen, true);
}
addEventListener("popstate", loadState);

export function pushState() {
	const current = location.search;
	const search = "?fen=" + FEN.value;
	if(search != decodeURIComponent(current)) {
		if(!current) history.replaceState(null, "", search);
		else history.pushState(null, "", search);
	}
}

export function toFEN() {
	FEN.value = makeFEN(squares.map(s => s.value));
	dispatchEvent(new Event("fen"));
}

function toSquares(check) {
	const fen = parseFEN(FEN.value);
	let changed = false;
	for(let i = 0; i < 64; i++) {
		squares[i].value = fen[i];
		changed = checkInputCore(squares[i]) || changed; // order matters
	}
	if(changed || check) toFEN();
	else dispatchEvent(new Event("fen"));
}

window.toSquares = toSquares;

export function updateSN() {
	for(const s of squares) checkInputCore(s);
	toFEN();
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