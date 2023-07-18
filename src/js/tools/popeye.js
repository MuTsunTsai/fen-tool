import { orthodoxForsyth } from "../squares";
import { state } from "../store";

let worker;
let startTime;

function stop() {
	const remain = 1000 - (performance.now() - startTime);
	setTimeout(() => state.popeye.running = false, Math.min(0, remain));
}

export const Popeye = {
	run() {
		if(!worker) {
			worker = new Worker("modules/py.js");
			worker.onmessage = event => {
				if(event.data === null) stop();
				else state.popeye.output += event.data + "\n";
			};
		}
		state.popeye.output = "";
		const fen = orthodoxForsyth(true);
		if(!fen) {
			alert("Only orthodox pieces are supported for now.");
			return;
		}
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
