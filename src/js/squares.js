import { FEN, realSize } from "./el";
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
			squares[index].style.background = (i + j) % 2 ? "#D18B47" : "#FFCE9E";
			squares[index].classList.add("square");
			container.appendChild(squares[index]);
		}
	}
	setSquareBG();
}

export function setSquareBG() {
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const s = squares[i * 8 + j];
			const dark = !store.board.uncolored && Boolean((i + j) % 2) != store.board.inverted;
			if(store.board.grayBG) {
				s.style.background = dark ? "#bbb" : "#fff";
			} else {
				s.style.background = dark ? "#D18B47" : "#FFCE9E";
			}
		}
	}
}

function squareOnFocus() { this.select(); }
function squareOnBlur() { this.style.zIndex = "unset"; }

const test = /^[-~]?(\*\d)?([kqbsnrpcx]|'[^']|''..)$/iu;

function checkInput() {
	checkInputCore(this);
	toFEN();
}

function checkInputCore(s) {
	let v = s.value;
	if(!v.match(test)) {
		// Text input shortcut
		const l = [...v].length;
		if(l == 1 && v != "'") v = "'" + v;
		else if(l == 2) v = "''" + v;
		else v = "";
	}
	v = v.replace(/^~/, "-") // both "-" and "~" are acceptable input
		.replace(/^-(?=.*')/, ""); // neutral has no effect on text
	if(v.startsWith("-")) v = v.toLowerCase();
	if(v.match(/^-?(\*\d)?[sn]$/i)) {
		if(store.board.SN) v = v.replace("n", "s").replace("N", "S");
		else v = v.replace("s", "n").replace("S", "N");
	}
	const changed = v != s.value;
	s.value = v;
	return changed;
}

export function setSquare(sq, value) {
	const updated = sq.value !== value;
	sq.value = value;
	checkInputCore(sq); // Needed for "S for knight"
	if(updated) toFEN();
}

window.setFEN = function(v, check) {
	FEN.value = v;
	toSquares(check);
}

export function toFEN() {
	let s = 0, t = "";
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const index = i * 8 + j;
			if(s && squares[index].value != "") {
				t += s;
				s = 0;
			}
			if(squares[index].value == "") {
				s++;
				if(j == 7) {
					t += s;
					s = 0;
				}
			} else {
				t += squares[index].value;
			}
		}
		if(i < 7) t += "/";
	}
	FEN.value = t;
	dispatchEvent(new Event("fen"));
}

function toSquares(check) {
	let cursor = 0, fen = [...FEN.value];
	let changed = false;
	function slice(n) {
		return fen.slice(cursor, cursor + n).join("");
	}
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const index = i * 8 + j;
			let char = fen[cursor] || "";
			if(char == "/") {
				cursor++;
				j--;
			} else if(char == "*") {
				squares[index].value = slice(3);
				cursor += 3;
			} else if(char == "-" || char == "~") {
				if(fen[cursor + 1] == "*") {
					squares[index].value = slice(4);
					cursor += 4;
				} else {
					squares[index].value = slice(2);
					cursor += 2;
				}
			} else if(char == "'") {
				if(fen[cursor + 1] == "'") {
					squares[index].value = slice(4);
					cursor += 4;
				} else {
					squares[index].value = slice(2);
					cursor += 2;
				}
			} else if(char.match(/\d/)) {
				let n = Number(char);
				for(let k = 0; k < n; k++) {
					if(k) {
						j++;
						if(j == 8) {
							i++;
							j = 0;
						}
					}
					squares[i * 8 + j].value = "";
				} cursor++;
			} else {
				squares[index].value = char;
				cursor++;
			}
			changed = checkInputCore(squares[index]) || changed; // order matters
		}
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