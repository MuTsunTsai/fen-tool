import { nextTick } from "petite-vue";
import { setFEN, snapshot } from "../squares";
import { state, store } from "../store";
import { formatSolution, toNormalFEN } from "../meta/popeye.mjs";
import { resize } from "../layout";
import { drawTemplate } from "../render";
import { makeForsyth } from "../meta/fen.mjs";
import { createAbbrExp, createAbbrReg } from "../meta/regex.mjs";

let path = "modules/py.js";
let worker;
let startTime;
let input;
let output; // in HTML
let suffix;
let interval;
let initFEN;
let shouldScroll = false;

const el = document.getElementById("Output");

function stop(keepRunning) {
	const remain = 1000 - (performance.now() - startTime);
	tryScroll();
	clearInterval(interval);
	if(!keepRunning) {
		state.popeye.output = output;
		setTimeout(() => state.popeye.running = false, Math.max(0, remain));
	}
}

function stepClick() {
	setFEN(this.dataset.fen);
	const popeye = state.popeye;
	popeye.steps[popeye.index].classList.remove("active");
	popeye.index = popeye.steps.indexOf(this);
	this.classList.add("active");
}

function animate() {
	suffix += ".";
	if(suffix.length == 5) suffix = ".";
	state.popeye.output = output + "<br>" + suffix;
	tryScroll();
}

function tryScroll() {
	if(shouldScroll) {
		shouldScroll = false;
		nextTick(() => el.scrollTop = el.scrollHeight - el.clientHeight);
	}
}

function terminate(keepRunning) {
	worker.terminate();
	worker = undefined;
	stop(keepRunning);
}

function start() {
	// Setup
	if(!worker) {
		worker = new Worker(path);
		worker.onmessage = event => {
			const data = event.data;
			if(data === -1) {
				path = "modules/py.asm.js"; // fallback to asm.js
				terminate(true);
				start();
				output = "Fallback to JS mode.<br>";
			} else if(data === null) {
				stop();
			} else {
				shouldScroll = shouldScroll || Boolean(el) && el.scrollTop + el.clientHeight + 30 > el.scrollHeight;
				if(typeof data.text == "string") output += escapeHtml(data.text) + "<br>";
				if(typeof data.err == "string") {
					state.popeye.error = true;
					output += `<span class="text-danger">${escapeHtml(data.err)}</span><br>`;
				}
			}
		};
	}

	// Initialize
	output = "";
	suffix = ".";
	state.popeye.error = false;
	interval = setInterval(animate, 500);
	startTime = performance.now();
	state.popeye.running = true;
	worker.postMessage("Opti NoBoard\n" + input); // NoBoard is used in any case
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

	if(new RegExp(`${FORSYTH}|${PIECES}`, "i").test(text)) {
		// If Forsyth command is used, get the board from it
		// Pieces command is not supported for now
		initFEN = text.match(new RegExp(String.raw`${FORSYTH}\s+(\S+)`, "i"))?.[1];
		if(initFEN) setFEN(toNormalFEN(initFEN));
		return text; // board is assigned manually
	} else {
		initFEN = getPopeyeFEN();
		if(!initFEN) return null;
		return `fors ${initFEN}\n${text}`;
	}
}

function toPopeyePiece(p) {
	if(p.startsWith("-")) p = "=" + p.substring(1).toLowerCase();
	if(!store.board.SN) {
		p = p.replace("n", "s").replace("N", "S");
	}
	return p;
}

export function getPopeyeFEN() {
	const { w, h } = store.board;
	if(w != 8 || h != 8) return null;
	const arr = snapshot().map(toPopeyePiece);
	return makeForsyth(arr, 8, 8);
}

export const Popeye = {
	run() {
		gtag("event", "fen_popeye_run");

		// Precondition
		input = parseInput(state.popeye.input);
		if(!input) {
			alert("Only orthodox pieces are supported for now.");
			return;
		}

		start();
	},
	cancel() {
		if(worker) terminate();
	},
	play() {
		gtag("event", "fen_popeye_play");
		state.popeye.output = formatSolution(input, initFEN, output);
		nextTick(() => {
			const popeye = state.popeye;
			popeye.steps = [...el.querySelectorAll("span")];
			popeye.steps.forEach(s => s.onclick = stepClick);
			popeye.index = 0;
			popeye.steps[0].classList.add("active");
			setFEN(popeye.steps[0].dataset.fen);
			popeye.playing = true;
			drawTemplate([]);
			nextTick(resize);
		});
	},
	exit() {
		state.popeye.output = output;
		state.popeye.playing = false;
		drawTemplate([]);
		nextTick(resize);
	},
	moveBy(v) {
		const popeye = state.popeye;
		let n = popeye.index;
		n += v;
		if(n < 0) n = 0;
		if(n > popeye.steps.length - 1) n = popeye.steps.length - 1;
		Popeye.move(n);
	},
	move(n) {
		const popeye = state.popeye;
		if(n == popeye.index) return;
		popeye.steps[popeye.index].classList.remove("active");
		popeye.index = n;
		const step = popeye.steps[n];
		step.classList.add("active");
		setFEN(step.dataset.fen);
	}
};
