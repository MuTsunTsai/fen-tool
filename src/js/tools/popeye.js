import { orthodoxForsyth } from "../squares";
import { state } from "../store";

let path = "modules/py.js";
let worker;
let startTime;
let output;
let suffix;
let int;

function stop() {
	const remain = 1000 - (performance.now() - startTime);
	state.popeye.output = output;
	clearInterval(int);
	setTimeout(() => state.popeye.running = false, Math.max(0, remain));
}

function animate() {
	suffix += ".";
	if(suffix.length == "5") suffix = ".";
	state.popeye.output = output + "\n" + suffix;
}

function terminate() {
	worker.terminate();
	worker = undefined;
	stop();
}

export const Popeye = {
	run() {
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
				if(event.data === -1) {
					console.log("fallback");
					path = "modules/py.asm.js"; // fallback to asm.js
					terminate();
					Popeye.run();
					output = "Fallback to JS mode.\n";
				} else if(event.data === null) stop();
				else output += event.data + "\n";
			};
		}

		// Initialize
		output = "";
		suffix = ".";
		int = setInterval(animate, 500);
		const input = `fors ${fen}\n${state.popeye.input}\nopti noboard`
		startTime = performance.now();
		state.popeye.running = true;
		worker.postMessage(input);
	},
	cancel() {
		if(worker) terminate();
	},
};
