import { background } from "./draw";
import { FEN, realSize } from "./el";
import { makeFEN, normalize, parseFEN } from "./fen.mjs";
import { store } from "./store";

export const squares = new Array(64);

export function setSquareSize() {
	const container = document.getElementById("Squares");
	const size = realSize();
	container.style.height = container.style.width = CN.clientWidth + "px";
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			squares[i * 8 + j].style.fontSize = (size - 10) + "px";
			squares[i * 8 + j].style.lineHeight = (size - 10) + "px";
		}
	}
}

window.setSquareSize = setSquareSize;

export function createSquares() {
	const container = document.getElementById("Squares");
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const index = i * 8 + j;
			squares[index] = document.createElement("input");
			squares[index].type = "text";
			squares[index].onchange = checkInput;
			squares[index].onfocus = squareOnFocus;
			squares[index].onblur = squareOnBlur;
			squares[index].classList.add("square");
			container.appendChild(squares[index]);
		}
	}
	setSquareBG();
	loadState();
}

export function setSquareBG() {
	const { pattern, bg } = store.board;
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const s = squares[i * 8 + j];
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