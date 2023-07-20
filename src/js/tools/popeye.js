import { nextTick } from "petite-vue";
import { orthodoxForsyth, setFEN } from "../squares";
import { state } from "../store";

let path = "modules/py.js";
let worker;
let startTime;
let output; // in HTML
let suffix;
let int;
let shouldScroll = false;

function stop(keepRunning) {
	const remain = 1000 - (performance.now() - startTime);
	tryScroll();
	clearInterval(int);
	if(!keepRunning) {
		state.popeye.output = output;
		setTimeout(() => state.popeye.running = false, Math.max(0, remain));
	}
}

function animate() {
	suffix += ".";
	if(suffix.length == 5) suffix = ".";
	state.popeye.output = output + "<br>" + suffix;
	tryScroll();
}

function tryScroll() {
	const el = document.getElementById("Output");
	if(shouldScroll && el) {
		shouldScroll = false;
		nextTick(() => el.scrollTop = el.scrollHeight - el.clientHeight);
	}
}

function terminate(keepRunning) {
	worker.terminate();
	worker = undefined;
	stop(keepRunning);
}

function escapeHtml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function start(input) {
	// Setup
	if(!worker) {
		worker = new Worker(path);
		worker.onmessage = event => {
			const data = event.data;
			if(data === -1) {
				path = "modules/py.asm.js"; // fallback to asm.js
				terminate(true);
				start(input);
				output = "Fallback to JS mode.<br>";
			} else if(data === null) {
				stop();
			} else {
				const el = document.getElementById("Output");
				shouldScroll = shouldScroll || Boolean(el) && el.scrollTop + el.clientHeight + 30 > el.scrollHeight;
				if(typeof data.text == "string") output += escapeHtml(data.text) + "<br>";
				if(typeof data.err == "string") output += `<span class="text-danger">${escapeHtml(data.err)}</span><br>`;
			}
		};
	}

	// Initialize
	output = "";
	suffix = ".";
	int = setInterval(animate, 500);
	startTime = performance.now();
	state.popeye.running = true;
	worker.postMessage("opti noboard\n" + input);
}

function parseInput(input) {
	input = input
		.replace(/prot\w*\s+\S+/i, "")	// remove protocol option
		.replace(/beg\w*/i, "")			// remove BeginProblem
		.replace(/next[\s\S]+$/im, "")	// accept only one problem input
		.replace(/end\w*/i, "");		// remove EndProblem
	if(/\b(fors|piec)\w*\b/i.test(input)) {
		const fen = input.match(/\bfors\w*\s+(\S+)/i)?.[1];
		if(fen) setFEN(toNormalFEN(fen));
		return input; // board is assigned manually
	} else {
		const fen = orthodoxForsyth(true);
		if(!fen) return null;
		return `fors ${fen}\n${input}`;
	}
}

function toNormalFEN(fen) {
	return fen.replace(/s/g, "n").replace(/S/g, "N");
}

export const Popeye = {
	run() {
		gtag("event", "fen_popeye_run");

		// Precondition
		const input = parseInput(state.popeye.input);
		if(!input) {
			alert("Only orthodox pieces are supported for now.");
			return;
		}

		start(input);
	},
	cancel() {
		if(worker) terminate();
	},
};
