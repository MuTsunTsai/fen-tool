import { nextTick } from "petite-vue";
import { orthodoxForsyth, setFEN } from "../squares";
import { state } from "../store";
import { formatSolution, toNormalFEN } from "../meta/popeye.mjs";
import { resize } from "../layout";
import { drawTemplate } from "../render";

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

function parseInput(text) {
	text = text
		.replace(/\b(rema|auth|orig|titl)\w*\s.+$/g, "")
		.replace(/\bprot\w*\s+\S+/i, "")		// remove protocol
		.replace(/\bbeg\w*/i, "")				// remove BeginProblem
		.replace(/\bnext\s[\s\S]+$/im, "")	// accept only one problem input
		.replace(/\bend\w*/i, "");			// remove EndProblem
	if(/\b(fors|piec)\w*\b/i.test(text)) {
		// If Forsyth command is used, get the board from it
		// Pieces command is not supported for now
		initFEN = text.match(/\bfors\w*\s+(\S+)/i)?.[1];
		if(initFEN) setFEN(toNormalFEN(initFEN));

		return text; // board is assigned manually
	} else {
		initFEN = orthodoxForsyth(true);
		if(!initFEN) return null;
		return `fors ${initFEN}\n${text}`;
	}
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
