import { FEN } from "./meta/el";
import { DEFAULT, INIT_FORSYTH, convertSN, inferDimension, invert, makeForsyth, mirror, normalize, parseFEN, rotate, shift } from "./meta/fen.mjs";
import { setOption } from "./layout";
import { state, store } from "./store";
import { readText } from "./copy";

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
	if(state.layout.collapse) {
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
	else if(state.layout.collapse) draw(snapshot());
}

function checkInput() {
	checkInputCore(this);
	if(state.layout.collapse) this.blur();
	toFEN();
}

function onInput() {
	if(!state.layout.collapse) {
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
	const arr = parseEdwards(v);
	FEN.value = arr[0] + (store.board.fullFEN ? Edwards() : "");;
	toSquares(check);
}

function parseEdwards(v) {
	const arr = v.split(" ");
	if(arr[1] && arr[1].match(/^[wb]$/)) state.play.turn = arr[1];
	if(arr[2] && arr[2].match(/^(-|[kq]+)$/i)) {
		for(const key in state.play.castle) {
			state.play.castle[key] = arr[2].includes(key);
		}
	}
	if(arr[3] && arr[3].match(/^[a-h][36]$/)) state.play.enPassant = arr[3];
	if(arr[4] && arr[4].match(/^\d+$/)) state.play.halfMove = Number(arr[4]);
	if(arr[5] && arr[5].match(/^\d+$/)) state.play.fullMove = Number(arr[5]);
	return arr;
}

export async function loadState() {
	if(state.play.playing) return;
	const url = new URL(location.href);
	const fen = url.searchParams.get("fen");
	if(fen) setFEN(fen, true);
}
addEventListener("popstate", loadState);

export function pushState() {
	const current = new URL(location.href).searchParams.get("fen") || DEFAULT;
	const forsyth = FEN.value.split(" ")[0];
	const url = forsyth == DEFAULT ? "" : "?fen=" + encodeURIComponent(forsyth);
	if(forsyth !== current) {
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
	const data = updateEdwards();
	draw(data);
}

export function updateEdwards() {
	const { w, h, fullFEN } = store.board;
	const data = snapshot();
	FEN.value = makeForsyth(data, w, h) + (fullFEN ? Edwards() : "");
	return data;
}

function orthodoxForsyth() {
	const { w, h } = store.board;
	if(w != 8 || h != 8) return null;
	const ss = normalSnapshot();
	for(const s of ss) {
		if(s != "" && !s.match(/^[kqbsnrp]$/i)) return null;
	}
	return makeForsyth(ss, 8, 8);
}

export function orthodoxFEN() {
	const forsyth = orthodoxForsyth();
	if(!forsyth) return null;
	return forsyth + Edwards(true);
}

function Edwards(check) {
	const p = state.play;

	if(!p.enPassant.match(/^[a-h][36]$/)) p.enPassant = ""; // Ignore invalid squares
	if(check && p.pass && p.enPassant && (p.enPassant[1] == "3") != (p.turn == "b")) {
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

function getCastle(check) {
	const ss = snapshot();
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
	const s = state.play;
	const arr = fen.split(" ");
	if(arr.length == 1) return;
	if(arr[1] == "w" || arr[1] == "b") s.turn = arr[1];
	if(arr[2]) {
		const keys = ["K", "Q", "k", "q"];
		for(const key of keys) s.castle[key] = arr[2].includes(key);
	}
	s.enPassant = !arr[3] || arr[3] == "-" ? "" : arr[3];
	if(s.mode != "retro") {
		s.halfMove = Number(arr[4] || 0);
		s.fullMove = Number(arr[5] || 1);
	}
}

export function updateSN() {
	let changed = false;
	for(const s of squares) changed = checkInputCore(s, true) || changed; // order matters
	if(changed) toFEN();
}

export function toggleReadOnly(readOnly) {
	for(const s of squares) s.readOnly = readOnly;
}

function replace(board) {
	board.forEach((v, i) => squares[i].value = v);
	toFEN();
}

export function resetEdwards() {
	Object.assign(state.play, {
		turn: "w",
		enPassant: "",
		halfMove: 0,
		fullMove: 1,
	});
	const keys = ["K", "Q", "k", "q"];
	for(const key of keys) state.play.castle[key] = true;
}

window.FEN = {
	update: () => {
		parseEdwards(FEN.value);
		toSquares(true);
	},
	empty() {
		for(const sq of squares) sq.value = "";
		toFEN();
	},
	reset() {
		setOption({ w: 8, h: 8 });
		if(store.board.fullFEN) resetEdwards();
		setFEN(INIT_FORSYTH);
	},
	copy() {
		gtag("event", "fen_copy");
		navigator.clipboard.writeText(FEN.value);
	},
	async paste() {
		gtag("event", "fen_paste");
		setFEN(await readText(), true);
	},
	rotate(d) {
		const { w, h } = store.board;
		if(w !== h) setOption({ w: h, h: w });
		replace(rotate(snapshot(), d, w, h));
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
		replace(invert(snapshot(), l));
	},
	shift(dx, dy) {
		const { w, h } = store.board;
		replace(shift(snapshot(), dx, dy, w, h));
	},
	mirror(d) {
		const { w, h } = store.board;
		replace(mirror(snapshot(), d, w, h));
	},
}