import { nextTick } from "petite-vue";
import { orthodoxForsyth } from "../squares";
import { state } from "../store";

let path = "modules/py.js";
let worker;
let startTime;
let output;
let suffix;
let int;
let shouldScroll = false;

function stop(keepRunning) {
	const remain = 1000 - (performance.now() - startTime);
	state.popeye.output = output;
	tryScroll();
	clearInterval(int);
	if(!keepRunning) setTimeout(() => state.popeye.running = false, Math.max(0, remain));
}

function animate() {
	suffix += ".";
	if(suffix.length == 5) suffix = ".";
	state.popeye.output =output + "<br>" + suffix;
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

export const Popeye = {
	run() {
		gtag("event", "fen_popeye_run");

		// Precondition
		const fen = orthodoxForsyth(true);
		if(!fen) {
			alert("Only orthodox pieces are supported for now.");
			return;
		}

		// Setup
		if(!worker) {
			worker = new Worker(path);
			worker.onmessage = event => {
				const data = event.data;
				if(data === -1) {
					path = "modules/py.asm.js"; // fallback to asm.js
					terminate(true);
					Popeye.run();
					output = "Fallback to JS mode.<br>";
				} else if(data === null) {
					stop();
				} else {
					const el = document.getElementById("Output");
					shouldScroll = shouldScroll || Boolean(el) && el.scrollTop + el.clientHeight + 30 > el.scrollHeight;
					if("text" in data) output += data.text + "<br>";
					if("err" in data) output += `<span class="text-danger">${data.err}</span><br>`;
				}
			};
		}

		// Initialize
		output = "";
		suffix = ".";
		int = setInterval(animate, 500);
		const input = `fors ${fen}\n${state.popeye.input}\nopti noboard`;
		startTime = performance.now();
		state.popeye.running = true;
		worker.postMessage(input);
	},
	cancel() {
		if(worker) terminate();
	},
};
