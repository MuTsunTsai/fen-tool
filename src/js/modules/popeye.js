
const popeyeInputFile = "/test.inp";
const popeyeMaxMem = "512M";
const args = ["-maxmem", popeyeMaxMem, popeyeInputFile];

var Module = {
	noInitialRun: true,
};

const ready = new Promise(resolve => Module.postRun = resolve);

Module.print = Module.printErr = text => postMessage(text);

addEventListener("message", async event => {
	await ready;
	FS.writeFile(popeyeInputFile, "BeginProblem\n" + event.data + "\nEndProblem");
	callMain(args);
	postMessage(null);
});
