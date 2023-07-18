
const popeyeInputFile = "/test.inp";
const popeyeMaxMem = "128M";
const args = ["py", "-maxmem", popeyeMaxMem, popeyeInputFile];

var Module = {
	noInitialRun: true,
};

Module.print = Module.printErr = text => postMessage(text);

addEventListener("message", event => {
	FS.writeFile(popeyeInputFile, "BeginProblem\n" + event.data + "\nEndProblem");

	const argv = new Uint32Array(args.length);
	for(var i = 0; i < args.length; i++) {
		argv[i] = allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL);
	}
	const bytes = argv.length * argv.BYTES_PER_ELEMENT;
	const ptrArgv = Module._malloc(bytes);
	const pointerHeap = new Uint8Array(Module.HEAPU8.buffer, ptrArgv, bytes);
	pointerHeap.set(new Uint8Array(argv.buffer));

	_main(args.length, pointerHeap.byteOffset);

	for(var i = 0; i < args.length; i++) {
		_free(argv[i]);
	}
	_free(ptrArgv);
});
