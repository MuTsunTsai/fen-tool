import { state } from "app/store";
import { tryScroll, updateShouldScroll } from "./output";

const INSUFFICIENT_MEMORY = -2;

/** Initial memory setting. */
const INIT_MEMORY = 512;

/**
 * Restrict the output to 3000 lines.
 *
 * Too much output is bad for user experience, and is not what this app is meant for.
 */
const MAX_LINES = 3000;

/** Interval to flush the output message. */
const OUTPUT_INTERVAL = 500;

/**
 * Minimal amount of memory required to run Popeye.
 *
 * Popeye is highly recursive and requires quite some stack memory to run.
 * We have set the stack size of Popeye WASM to 8MB, so 16MB total sounds reasonable.
 */
const MIN_MEMORY = 16;

let worker: Worker | undefined;

/** Current memory setting. */
let memory: number;

let startTime: number;
let interval: number;
let outputCount: number;

function createWorker(): Worker {
	if(worker) return worker;
	const w = new Worker(new URL("../../modules/popeye.js", import.meta.url), { name: "py" });
	worker = w;
	w.onerror = event => {
		event.preventDefault();
		clearInterval(interval);
		state.popeye.running = false;
		let msg;
		if(!event.filename) {
			msg = "Unable to load the Popeye module; please check your network connection.";
		} else {
			w.terminate();
			msg = "An error occur in the Popeye module. Please submit an issue about this.\n" + event.message;
		}
		state.popeye.output = error(msg);
		worker = undefined;
	};
	w.onmessage = event => {
		const data = event.data;
		if(++outputCount > MAX_LINES) {
			state.popeye.intOutput += `<br>${error("Too much output. Please modify the input to prevent excessive output.")}<br>`;
			stop();
		} else if(data === INSUFFICIENT_MEMORY) {
			memory /= 2;
			if(memory < MIN_MEMORY) {
				state.popeye.intOutput += `<br>${error("Not enough memory to run Popeye.")}<br>`;
			}
			stop(memory >= MIN_MEMORY);
		} else if(data === null) {
			stop();
		} else {
			updateShouldScroll();
			if(typeof data.text == "string") {
				let txt = escapeHtml(data.text);
				if(txt.match(/\s+\d+\s+\([^)]+Time = [^)]+s\)/)) { // opti movenum
					txt = `<span class="text-secondary">${txt}</span>`;
				}
				state.popeye.intOutput += txt + "<br>";
			}
			if(typeof data.err == "string") {
				if(data.err == "Calling stub instead of signal()") return; // It seems that this error can be ignored
				state.popeye.error = true;
				state.popeye.intOutput += error(escapeHtml(data.err));
			}
		}
	};
	return w;
}

export function initMemory(): void {
	memory = INIT_MEMORY;
}

export function start(): void {
	const w = createWorker();

	const p = state.popeye;
	outputCount = 0;
	p.intOutput = "";
	p.error = false;
	p.running = true;
	interval = setInterval(flush, OUTPUT_INTERVAL);
	startTime = performance.now();
	w.postMessage({
		mem: memory,
		input: "Opti NoBoard\n" + p.intInput,
	}); // NoBoard is used in any case
}

function flush(): void {
	state.popeye.output = state.popeye.intOutput + `<br><i class="fa-solid fa-spinner fa-spin"></i>`;
	tryScroll();
}

function stop(restart?: boolean): void {
	if(worker) worker.terminate();
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

export function cancel(): void {
	if(worker) stop();
}

function error(text: string): string {
	return `<span class="text-danger">${text}</span>`;
}

function escapeHtml(text: string): string {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
