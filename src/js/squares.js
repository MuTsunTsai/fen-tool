import { FEN } from "./meta/el";
import { DEFAULT, convertSN, inferDimension, makeFEN, normalize, parseFEN } from "./meta/fen.mjs";
import { mode, setOption } from "./layout";
import { state, store } from "./store";

export const squares = new Array(64);
export const container = document.getElementById("Squares");
export const callback = {};

function draw(data) {
	callback.draw?.(data);
}

export function setSquareSize(size) {
	container.style.width = CN.clientWidth + "px";
	container.style.height = CN.clientHeight + "px";
	for(const sq of squares) {
		sq.style.fontSize = (size - 10) + "px";
		sq.style.lineHeight = (size - 10) + "px";
	}
}

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
			sq.oninput = onInput;
			sq.onchange = checkInput;
			sq.onfocus = squareOnFocus;
			sq.onblur = squareOnBlur;
			sq.classList.add("square");
			container.appendChild(sq);
		}
		squares[i].style.display = i < total ? "block" : "none";
	}
}

function squareOnFocus() {
	this.style.zIndex = "10";
	if(mode.collapse) {
		const data = snapshot();
		data[squares.indexOf(this)] = "";
		draw(data);
	}
	this.select();
}
function squareOnBlur() {
	this.style.zIndex = "unset";
	// We check the input again on blur, as some browser extensions could
	// programmatically modify its value without triggering onchange event.
	if(checkInputCore(this)) toFEN();
	else if(mode.collapse) draw();
}

function checkInput() {
	checkInputCore(this);
	if(mode.collapse) this.blur();
	toFEN();
}

function onInput() {
	if(!mode.collapse) {
		const data = snapshot();
		data[squares.indexOf(this)] = normalize(this.value, store.board.SN);
		draw(data);
	}
}

function checkInputCore(s, convert) {
	let v = normalize(s.value, store.board.SN, convert);
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

export function loadState() {
	if(state.play.playing) return;
	const url = new URL(location.href);
	const fen = url.searchParams.get("fen");
	if(fen) setFEN(fen, true);
}
addEventListener("popstate", loadState);

export function pushState() {
	const current = location.search;
	const url = FEN.value == DEFAULT ? "" : "?fen=" + encodeURI(FEN.value);
	if(url !== decodeURIComponent(current)) {
		history.pushState(null, "", url || ".");
	}
}

export function snapshot() {
	return squares.map(s => s.value);
}

export function normalSnapshot() {
	return snapshot().map(v => convertSN(v, false, true));
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
	const data = snapshot();
	FEN.value = makeFEN(data, w, h);
	draw(data);
}

export function orthodoxFEN() {
	const { w, h } = store.board;
	if(w != 8 || h != 8) return null;
	for(const s of squares) {
		const value = convertSN(s.value, false, true);
		if(value != "" && !value.match(/^[kqbnrp]$/i)) return null;
	}
	const p = state.play;

	if(!p.enPassant.match(/^[a-h][35]$/)) p.enPassant = ""; // Ignore invalid squares
	if(p.pass && p.enPassant && (p.enPassant[1] == "3") != (p.turn == "b")) {
		// In passing mode, auto-correct the turn if ep is given
		p.turn = p.turn == "b" ? "w" : "b";
	}

	if(!Number.isSafeInteger(p.halfMove) || p.halfMove < 0) p.halfMove = 0;
	if(!Number.isSafeInteger(p.fullMove) || p.fullMove < 1) p.fullMove = 1;

	const ss = normalSnapshot();
	return `${makeFEN(ss, 8, 8)} ${p.turn} ${getCastle(ss)} ${p.enPassant || "-"} ${p.halfMove} ${p.fullMove}`;
}

function getCastle(snapshot) {
	let result = "";
	const c = state.play.castle;
	// Chess.js doesn't really check if the castling parameters make sense;
	// so we have to double check the parameters here.
	// TODO: support Chess960 here
	if(snapshot[60] == "K") {
		if(c.K && snapshot[63] == "R") result += "K";
		if(c.Q && snapshot[56] == "R") result += "Q";
	}
	if(snapshot[4] == "k") {
		if(c.k && snapshot[7] == "r") result += "k";
		if(c.q && snapshot[0] == "r") result += "q";
	}
	return result == "" ? "-" : result;
}

function toSquares(check) {
	parseFullFEN(FEN.value);
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
	else draw(snapshot());
}

export function parseFullFEN(fen) {
	const arr = fen.split(" ");
	if(arr.length == 1) return;
	if(arr[1] == "w" || arr[1] == "b") state.play.turn = arr[1];
	if(arr[2]) {
		const keys = ["K", "Q", "k", "q"];
		for(const key of keys) state.play.castle[key] = arr[2].includes(key);
	}
	state.play.enPassant = !arr[3] || arr[3] == "-" ? "" : arr[3];
	state.play.halfMove = Number(arr[4] || 0);
	state.play.fullMove = Number(arr[5] || 1);
}

export function updateSN() {
	let changed = false;
	for(const s of squares) changed = checkInputCore(s, true) || changed; // order matters
	if(changed) toFEN();
}

export function toggleReadOnly(readOnly) {
	for(const s of squares) s.readOnly = readOnly;
}

window.FEN = {
	update: () => toSquares(true),
	empty() {
		for(const sq of squares) sq.value = "";
		toFEN();
	},
	reset() {
		setOption({ w: 8, h: 8 });
		setFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
	},
	copy() {
		gtag("event", "fen_copy");
		navigator.clipboard.writeText(FEN.value);
	},
	async paste() {
		gtag("event", "fen_paste");
		FEN.value = await navigator.clipboard.readText();
		toSquares(true);
	},
	rotate(d) {
		const temp = snapshot();
		const { w, h } = store.board;
		if(w !== h) setOption({ w: h, h: w });
		for(let i = 0; i < w; i++) {
			for(let j = 0; j < h; j++) {
				const target = d == 1 ? (h - 1 - j) * w + i : j * w + (w - 1 - i);
				squares[i * h + j].value = temp[target];
			}
		}
		toFEN();
	},
	color(c) {
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
	invert(l) {
		for(const sq of squares) {
			let s = sq.value;
			if(s == "" || s.startsWith("-")) continue;
			if(!l && s.startsWith("'")) continue;
			const t = s.toLowerCase();
			if(s == t) s = s.toUpperCase();
			else s = t;
			sq.value = s;
		}
		toFEN();
	},
}