import { nextTick } from "vue";

import { setFEN, createSnapshot } from "js/interface/squares";
import { onSession, state, store } from "js/store";
import { formatSolution, toNormalFEN } from "js/meta/popeye/popeye";
import { resize } from "js/interface/layout";
import { drawTemplate, load } from "js/view/render";
import { makeForsyth, toSquare } from "js/meta/fen";
import { createAbbrExp, createAbbrReg } from "js/meta/regex";
import { P, defaultCustomMap, toPopeyePiece } from "js/meta/popeye/base";
import { animate, stopAnimation } from "js/view/animation";
import { parsePieceCommand } from "js/meta/popeye/piece";
import { BOARD_SIZE, MIN_MEMORY } from "js/meta/constants";
import { alert } from "js/meta/dialogs";

const INSUFFICIENT_MEMORY = -2;
const MAX_LINES = 3000;
const OUTPUT_INTERVAL = 500;
const INIT_MEMORY = 512; // Initial settings

// Session
onSession(() => {
	state.popeye.running = false; // Do not restore this state
	state.popeye.editMap = false;
	if(state.popeye.playing) {
		load().then(() => nextTick(() => setupStepElements(true)));
	}
});

/** @type {Worker} */
let worker;

/** Current memory setting. */
let memory;

let path = "modules/py489.js";
let startTime;
let interval;
let outputCount;
let shouldScroll = false;

const el = document.getElementById("Output");

function flush() {
	state.popeye.output = state.popeye.intOutput + `<br><i class="fa-solid fa-spinner fa-spin"></i>`;
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
	const remain = OUTPUT_INTERVAL - (performance.now() - startTime);
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
	worker.onerror = event => {
		event.preventDefault();
		clearInterval(interval);
		state.popeye.running = false;
		let msg;
		if(!event.filename) {
			msg = "Unable to load the Popeye module; please check your network connection.";
		} else {
			worker.terminate();
			msg = "An error occur in the Popeye module. Please submit an issue about this.\n" + event.message;
		}
		state.popeye.output = error(msg);
		worker = undefined;
	};
	worker.onmessage = event => {
		const data = event.data;
		if(++outputCount > MAX_LINES) {
			// Restrict the output to 3000 lines.
			// Too much output is bad for user experience, and is not what this app is meant for.
			state.popeye.intOutput += `<br>${error("Too much output. Please modify the input to prevent excessive output.")}<br>`;
			stop();
		} else if(data === -1) {
			gtag("event", "fen_popeye_fallback");
			path = "modules/py489.asm.js"; // fallback to asm.js
			stop(true);
			state.popeye.intOutput = "Fallback to JS mode.<br>";
		} else if(data === INSUFFICIENT_MEMORY) {
			memory /= 2;
			stop(memory >= MIN_MEMORY);
		} else if(data === null) {
			stop();
		} else {
			shouldScroll = shouldScroll || elIsAlmostBottom();
			if(typeof data.text == "string") state.popeye.intOutput += escapeHtml(data.text) + "<br>";
			if(typeof data.err == "string") {
				state.popeye.error = true;
				state.popeye.intOutput += error(escapeHtml(data.err));
			}
		}
	};
}

function elIsAlmostBottom() {
	const threshold = 30;
	return Boolean(el) && el.scrollTop + el.clientHeight + threshold > el.scrollHeight;
}

function start() {
	createWorker();

	const p = state.popeye;
	outputCount = 0;
	p.intOutput = "";
	p.error = false;
	p.running = true;
	interval = setInterval(flush, OUTPUT_INTERVAL);
	startTime = performance.now();
	worker.postMessage({
		mem: memory,
		input: "Opti NoBoard\n" + p.intInput,
	}); // NoBoard is used in any case
}

function error(text) {
	return `<span class="text-danger">${text}</span>`;
}

function escapeHtml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const Commands = ["remark", "2author", "2origin", "3title"];
const COMMANDS = new RegExp(String.raw`(?:${Commands.map(createAbbrExp).join("|")})\s.+$`, "igm");
const PROTOCOL = new RegExp(String.raw`${createAbbrExp("5protocol")}\s+\S+`, "i");
const BEGIN = createAbbrReg("3beginProblem");
const END = createAbbrReg("3endProblem");
const NEXT = /\bnext\s[\s\S]+$/i;
const FORSYTH = createAbbrExp("3forsyth");
const PIECES = createAbbrExp("2pieces");

function parseInput(text) {
	text = text
		.replace(COMMANDS, "")	// remove remark, author, origin, title
		.replace(PROTOCOL, "")	// remove protocol
		.replace(BEGIN, "") // remove BeginProblem
		.replace(NEXT, "") // accept only one problem input
		.replace(END, ""); // remove EndProblem

	const p = state.popeye;
	if(new RegExp(`${FORSYTH}|${PIECES}`, "i").test(text)) {
		// If Forsyth command or Pieces command is used, get the board from it
		p.initFEN = parsePieceCommand(text) || text.match(new RegExp(String.raw`${FORSYTH}\s+(\S+)`, "i"))?.[1];
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
	if(w != BOARD_SIZE || h != BOARD_SIZE) return null;
	const imitators = [];
	const arr = createSnapshot().map((p, i) => {
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
	return { fen: makeForsyth(arr), imitators };
}

async function setupStepElements(restore) {
	const p = state.popeye;
	p.steps = [...el.querySelectorAll("span")];
	if(p.steps.length == 0) return;
	goTo(0, true);
	p.playing = true;
	if(restore) await load();
	drawTemplate([]);
	nextTick(resize);
}

async function goTo(index, init) {
	const p = state.popeye;
	const newStep = p.steps[index];
	const oldStep = p.steps[p.index];
	if(
		oldStep && oldStep.dataset.anime &&
		(
			index == p.index - 1 && !oldStep.dataset.before ||
			newStep.dataset.fen == oldStep.dataset.before
		)
	) {
		await animate(newStep.dataset.fen, oldStep.dataset.fen, oldStep.dataset.anime, true);
	} else {
		const before = newStep.dataset.before || p.steps[index - 1]?.dataset.fen;
		if(newStep.dataset.anime && before) {
			await animate(before, newStep.dataset.fen, newStep.dataset.anime);
		} else {
			stopAnimation();
			setFEN(newStep.dataset.fen);
		}
	}
	if(!init) oldStep.classList.remove("active");
	p.index = index;
	newStep.classList.add("active");

	// This needs to be execute on next tick,
	// as the rendering could change the scroll dimension temporarily
	nextTick(() => scrollTo(newStep));
}

function scrollTo(step) {
	// We cannot simply use scrollIntoView here, as that will also scroll the entire page,
	// which is not the desired behavior.
	const margin = 10;
	const top = step.offsetTop - margin;
	if(el.scrollTop > top) el.scrollTop = top;
	const bottom = step.offsetTop + step.clientHeight - el.clientHeight + margin;
	if(el.scrollTop < bottom) el.scrollTop = bottom;
	const left = step.offsetLeft - margin;
	if(el.scrollLeft > left) el.scrollLeft = left;
	const right = step.offsetLeft + step.clientWidth - el.clientWidth + margin;
	if(el.scrollLeft < right) el.scrollLeft = right;
}

export const Popeye = {
	run() {
		gtag("event", "fen_popeye_run");
		memory = INIT_MEMORY;
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
		el.scrollTop = el.scrollLeft = 0; // Reset
		gtag("event", "fen_popeye_play");
		p.output = formatSolution(p.intInput, p.initFEN, p.intOutput);
		nextTick(setupStepElements);
	},
	step(e) {
		const p = state.popeye;
		if(!p.playing) return;
		const index = p.steps.indexOf(e.target);
		if(index >= 0 && index != p.index) {
			e.preventDefault();
			goTo(index);
		}
	},
	exit() {
		const p = state.popeye;
		setFEN(p.steps[0].dataset.fen);
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
		if(n != state.popeye.index) goTo(n);
	},
	editMap() {
		gtag("event", "fen_popeye_edit_map");
		state.popeye.mapping = getMappingText(store.popeye.pieceMap);
		state.popeye.editMap = true;
	},
	resetMap() {
		state.popeye.mapping = getMappingText(defaultCustomMap);
	},
	saveMap() {
		const lines = state.popeye.mapping.toUpperCase().split("\n");
		const map = {};
		for(const line of lines) {
			const [k, v] = line.replace(/\s/g, "").split("=");
			if(k.match(KEY) && v && v.match(VALUE)) map[k] = v;
		}
		store.popeye.pieceMap = map;
		state.popeye.editMap = false;
	},
};

function getMappingText(pieceMap) {
	const map = [];
	for(const key in pieceMap) {
		map.push(`${key}=${pieceMap[key]}`);
	}
	return map.join("\n");
}

const KEY = /^(\*[1-3][KQBNRP]|(\*[1-3])?[CXSTAD]|''..|'.)$/;
const VALUE = new RegExp(`^${P}$`);