import { orthodoxForsyth } from "../squares";
import { state } from "../store";

let worker;

export function popeye() {
	if(!worker) {
		worker = new Worker("modules/py.js");
		worker.onmessage = event => state.popeye.output += event.data + "\n";
	}
	state.popeye.output = "";
	const fen = orthodoxForsyth(true);
	if(!fen) {
		alert("Only orthodox pieces are supported for now.");
		return;
	}
	const input = `fors ${fen}\n${state.popeye.input}\nopti noboard`
	worker.postMessage(input);
}
