import { nextTick } from "petite-vue";
import { setFEN, snapshot } from "../squares";
import { state, store } from "../store";
import { formatSolution, toNormalFEN } from "../meta/popeye/popeye.mjs";
import { resize } from "../layout";
import { drawTemplate, load } from "../render";
import { makeForsyth, toSquare } from "../meta/fen.mjs";
import { createAbbrExp, createAbbrReg } from "../meta/regex.mjs";
import { P, defaultCustomMap, toPopeyePiece } from "../meta/popeye/base.mjs";
import { clone } from "../meta/clone.mjs";

// Session
state.popeye.running = false; // Do not restore this state
state.popeye.editMap = false;
if(state.popeye.playing) nextTick(() => setupStepElements(true));

let path = "modules/py.js";
let worker;
let startTime;
let suffix;
let interval;
let outputCount;
let shouldScroll = false;

const el = document.getElementById("Output");

function stepClick() {
	setFEN(this.dataset.fen);
	const p = state.popeye;
	p.steps[p.index].classList.remove("active");
	p.index = p.steps.indexOf(this);
	this.classList.add("active");
}

function animate() {
	suffix += ".";
	if(suffix.length == 5) suffix = ".";
	state.popeye.output = state.popeye.intOutput + "<br>" + suffix;
	tryScroll();
}

function tryScroll() {
	if(shouldScroll) {
		shouldScroll = false;
		nextTick(() => el.scrollTop = el.scrollHeight - el.clientHeight);
	}
}

function stop(restart) {
	worker.terminate();
	worker = undefined;
	const remain = 500 - (performance.now() - startTime);
	tryScroll();
	clearInterval(interval);
	if(!restart) {
		state.popeye.output = state.popeye.intOutput;
		setTimeout(() => state.popeye.running = false, Math.max(0, remain));
		createWorker();
	} else {
		start();
	}
}

function createWorker() {
	if(worker) return;
	worker = new Worker(path);
	worker.onmessage = event => {
		const data = event.data;
		if(++outputCount > 3000) {
			// Restrict the output to 3000 lines.
			// Too much output is bad for user experience, and is not what this app is meant for.
			state.popeye.intOutput += `<br><span class="text-danger">Too much output. Please modify the input to prevent excessive output.</span><br>`
			stop();
		} else if(data === -1) {
			gtag("event", "fen_popeye_fallback");
			path = "modules/py.asm.js"; // fallback to asm.js
			stop(true);
			state.popeye.intOutput = "Fallback to JS mode.<br>";
		} else if(data === null) {
			stop();
		} else {
			shouldScroll = shouldScroll || Boolean(el) && el.scrollTop + el.clientHeight + 30 > el.scrollHeight;
			if(typeof data.text == "string") state.popeye.intOutput += escapeHtml(data.text) + "<br>";
			if(typeof data.err == "string") {
				state.popeye.error = true;
				state.popeye.intOutput += `<span class="text-danger">${escapeHtml(data.err)}</span><br>`;
			}
		}
	};
}

function start() {
	createWorker();

	suffix = ".";
	const p = state.popeye;
	outputCount = 0;
	p.intOutput = "";
	p.error = false;
	p.running = true;
	interval = setInterval(animate, 500);
	startTime = performance.now();
	worker.postMessage("Opti NoBoard\n" + p.intInput); // NoBoard is used in any case
}

function escapeHtml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const Commands = ["remark", "author", "origin", "title"];
const COMMANDS = new RegExp(String.raw`(?:${Commands.map(createAbbrExp).join("|")})\s.+$`, "igm");
const PROTOCOL = new RegExp(String.raw`${createAbbrExp("protocol")}\s+\S+`, "i");
const BEGIN = createAbbrReg("beginProblem");
const END = createAbbrReg("endProblem");
const NEXT = /\bnext\s[\s\S]+$/i;
const FORSYTH = createAbbrExp("forsyth");
const PIECES = createAbbrExp("pieces");

function parseInput(text) {
	text = text
		.replace(COMMANDS, "")	// remove remark, author, origin, title
		.replace(PROTOCOL, "")	// remove protocol
		.replace(BEGIN, "")		// remove BeginProblem
		.replace(NEXT, "")		// accept only one problem input
		.replace(END, "");		// remove EndProblem

	const p = state.popeye;
	if(new RegExp(`${FORSYTH}|${PIECES}`, "i").test(text)) {
		// If Forsyth command is used, get the board from it
		// Pieces command is not supported for now
		p.initFEN = text.match(new RegExp(String.raw`${FORSYTH}\s+(\S+)`, "i"))?.[1];
		if(p.initFEN) setFEN(toNormalFEN(p.initFEN));
		return text; // board is assigned manually
	} else {
		const { fen, imitators } = getPopeyeFEN();
		p.initFEN = fen;
		if(imitators.length) text += "\ncond imitator " + imitators.join("");
		return `fors ${p.initFEN}\n${text}`;
	}
}

export function getPopeyeFEN() {
	const { w, h } = store.board;
	if(w != 8 || h != 8) return null;
	const imitators = [];
	const arr = snapshot().map((p, i) => {
		if(p == "") return p;
		let f = store.board.SN ? p.replace("s", "n").replace("S", "N").replace("g", "s").replace("G", "S") : p; // normalize
		f = toPopeyePiece(f);
		if(!f) throw alert("Unspecified fairy piece: " + p);
		if(f.match(/^=?i$/i)) {
			imitators.push(toSquare(i));
			return "";
		}
		return f;
	});
	return { fen: makeForsyth(arr, 8, 8), imitators };
}

async function setupStepElements(restore) {
	const p = state.popeye;
	p.steps = [...el.querySelectorAll("span")];
	p.steps.forEach(s => s.onclick = stepClick);
	p.index = 0;
	p.steps[0].classList.add("active");
	setFEN(p.steps[0].dataset.fen);
	p.playing = true;
	if(restore) await load();
	drawTemplate([]);
	nextTick(resize);
}

export const Popeye = {
	run() {
		gtag("event", "fen_popeye_run");
		try {
			const p = state.popeye;
			p.intInput = parseInput(p.input);
			start();
		} catch {
			// ignore error
		}
	},
	cancel() {
		if(worker) stop();
	},
	play() {
		const p = state.popeye;
		gtag("event", "fen_popeye_play");
		p.output = formatSolution(p.intInput, p.initFEN, p.intOutput);
		nextTick(setupStepElements);
	},
	exit() {
		const p = state.popeye;
		p.output = p.intOutput;
		p.playing = false;
		drawTemplate([]);
		nextTick(resize);
	},
	moveBy(v) {
		const p = state.popeye;
		let n = p.index;
		n += v;
		if(n < 0) n = 0;
		if(n > p.steps.length - 1) n = p.steps.length - 1;
		Popeye.move(n);
	},
	move(n) {
		const p = state.popeye;
		if(n == p.index) return;
		p.steps[p.index].classList.remove("active");
		p.index = n;
		const step = p.steps[n];
		step.classList.add("active");
		setFEN(step.dataset.fen);

		// We cannot simply use scrollIntoView here, as that will also scroll the entire page,
		// which is not the desired behavior.
		if(el.scrollTop > step.offsetTop) el.scrollTop = step.offsetTop;
		const bottom = step.offsetTop + step.clientHeight - el.clientHeight;
		if(el.scrollTop < bottom) el.scrollTop = bottom;
		if(el.scrollLeft > step.offsetLeft) el.scrollLeft = step.offsetLeft;
		const right = step.offsetLeft + step.clientWidth - el.clientWidth;
		if(el.scrollLeft < right) el.scrollLeft = right;
	},
	editMap() {
		const map = [];
		for(const key in store.popeye.pieceMap) {
			map.push(`${key}=${store.popeye.pieceMap[key]}`);
		}
		state.popeye.mapping = map.join("\n");
		state.popeye.editMap = true;
	},
	resetMap() {
		store.popeye.pieceMap = clone(defaultCustomMap);
		Popeye.editMap();
	},
	saveMap() {
		const lines = state.popeye.mapping.toUpperCase().split("\n");
		const map = {};
		for(const line of lines) {
			let [k, v] = line.replace(/\s/g, "").split("=");
			if(k.match(KEY) && v && v.match(VALUE)) map[k] = v;
		}
		store.popeye.pieceMap = map;
		state.popeye.editMap = false;
	}
};

const KEY = /^(\*[1-3][KQBNRP]|(\*[1-3])?[CXSTAD]|''..|'.)$/;
const VALUE = new RegExp(`^${P}$`);