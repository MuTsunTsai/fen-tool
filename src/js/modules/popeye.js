/* eslint-disable no-var */
/* eslint-disable no-undef */
// This file is appended before py.js or py.asm.js

const INSUFFICIENT_MEMORY = -2;

const popeyeInputFile = "/test.inp";

var Module = {
	noInitialRun: true,
};

const ready = new Promise(resolve => Module.postRun = resolve);

Module.print = text => {
	if(text.includes("Couldn't allocate")) {
		// Need to reduce memory setting.
		postMessage(INSUFFICIENT_MEMORY);
	} else {
		postMessage({ text });
	}
};
Module.printErr = err => {
	if(err.includes("Maximum call stack size exceeded")) {
		// Some versions of Safari and iOS has a bug that could result in this error
		// when running wasm in worker. In that case we fallback to use asm.js instead.
		postMessage(-1);
	} else {
		postMessage({ err });
	}
};

addEventListener("message", async event => {
	await ready;
	FS.writeFile(popeyeInputFile, "BeginProblem\n" + event.data.input + "\nEndProblem");
	try {
		callMain(["-maxmem", event.data.mem + "M", popeyeInputFile]);
	} finally {
		postMessage(null); // signify finished
	}
});
