const cb = navigator.clipboard;

/**
 * It is not enough to check if `navigator.share` exists.
 * For example, Android Firefox do support sharing URLs, but not images.
 * Therefore we need to actually call `navigator.canShare` method to test it.
 */
function testPngShare() {
	if(!("canShare" in navigator)) return false;
	// Generated using png-pixel.com
	const binary = atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII");
	const array = new Uint8Array(binary.length)
	for(let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
	const blob = new Blob([array]);
	const file = new File([blob], "1.png", { type: "image/png" });
	return navigator.canShare({ files: [file] })
}

const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;

export const env = {
	canShare: testPngShare(),
	canCopy: cb && "writeText" in cb,
	canPaste: cb && "readText" in cb,
	canCopyImg: cb && "write" in cb,
	isTouch,
	isTaiwanDesktop: navigator.languages.includes("zh-TW") && !isTouch,
};