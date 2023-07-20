
const popeyeInputFile = "/test.inp";
const popeyeMaxMem = "512M";
const args = ["-maxmem", popeyeMaxMem, popeyeInputFile];

var Module = {
	noInitialRun: true,
};

const ready = new Promise(resolve => Module.postRun = resolve);

Module.print = text => postMessage({ text });
Module.printErr = err => {
	if(err.includes("Maximum call stack size exceeded")) {
		// Some versions of Safari and iOS has a bug that could result in this error
		// when running wasm in worker. In that case we fallback to use asm.js instead.
		postMessage(-1);
	} else postMessage({ err });
};

addEventListener("message", async event => {
	await ready;
	FS.writeFile(popeyeInputFile, "BeginProblem\n" + event.data + "\nEndProblem");
	try {
		callMain(args);
	} finally {
		postMessage(null); // signify finished
	}
});
