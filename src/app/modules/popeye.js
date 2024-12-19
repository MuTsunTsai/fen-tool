
import module from "../../../lib/popeye/py.js";

const INSUFFICIENT_MEMORY = -2;

const popeyeInputFile = "/test.inp";

const Module = {
	print: text => {
		if(text.includes("Couldn't allocate")) {
			// Need to reduce memory setting.
			postMessage(INSUFFICIENT_MEMORY);
		} else {
			postMessage({ text });
		}
	},
	printErr: err => postMessage({ err }),
	noInitialRun: true,
};

addEventListener("message", async event => {
	const instance = await modulePromise;
	console.log(instance);
	instance.FS.writeFile(popeyeInputFile, "BeginProblem\n" + event.data.input + "\nEndProblem");
	try {
		instance.callMain(["-maxmem", event.data.mem + "M", popeyeInputFile]);
	} finally {
		postMessage(null); // signify finished
	}
});

const modulePromise = module(Module);
