const cb = navigator.clipboard;

const canShare = "canShare" in navigator;

export const dpr = Math.min(2, Math.floor(devicePixelRatio));

/**
 * It is not enough to check if `navigator.share` exists.
 * For example, Firefox Android do support sharing URLs, but not images.
 * Therefore we need to actually call `navigator.canShare` method to test it.
 */
function testPngShare(): boolean {
	if(!canShare) return false;
	// Generated using png-pixel.com
	const binary = atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII");
	const array = new Uint8Array(binary.length);
	for(let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
	const blob = new Blob([array]);
	const file = new File([blob], "1.png", { type: "image/png" });
	return navigator.canShare({ files: [file] });
}

const isTouch = matchMedia("(hover: none), (pointer: coarse)").matches;

/**
 * Firefox has this `privacy.resistFingerprinting` settings that would result
 * in canvas malfunctioning. This function detects if the setting is on.
 */
export function testResistFingerprinting(): boolean {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d")!;
	ctx.fillStyle = "rgb(255, 0, 0)";
	ctx.fillRect(0, 0, 1, 1);
	const data = ctx.getImageData(0, 0, 2, 2).data;
	// eslint-disable-next-line @typescript-eslint/no-magic-numbers
	const expect = [255, 0, 0, 255];
	for(let i = 0; i < expect.length; i++) if(data[i] != expect[i]) return true;
	return false;
}

export const env = {
	isTop: top == self,
	thread: typeof SharedArrayBuffer != "undefined",
	canShare,
	canSharePng: testPngShare(),
	canCopy: cb && "writeText" in cb,
	canPaste: cb && "readText" in cb,
	canCopyImg: cb && "write" in cb,
	isTouch,
	isTaiwan: navigator.languages.includes("zh-TW"),
};
