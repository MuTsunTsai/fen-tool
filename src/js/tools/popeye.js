import { orthodoxForsyth } from "../squares";
import { state } from "../store";

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

export const Popeye = {
	run() {
		if(!worker) {
			worker = new Worker("modules/py.js");
			worker.onmessage = event => {
				if(event.data === null) stop();
				else output += event.data + "\n";
			};
		}
		const fen = orthodoxForsyth(true);
		if(!fen) {
			alert("Only orthodox pieces are supported for now.");
			return;
		}
		output = "";
		suffix = ".";
		int = setInterval(animate, 500);
		const input = `fors ${fen}\n${state.popeye.input}\nopti noboard`
		startTime = performance.now();
		state.popeye.running = true;
		worker.postMessage(input);
	},
	cancel() {
		if(worker) {
			worker.terminate();
			worker = undefined;
			stop();
		}
	}
};
