import { getBlob } from "./render";

export const env = {
	canCopy: "clipboard" in navigator && "writeText" in navigator.clipboard,
	canPaste: "clipboard" in navigator && "readText" in navigator.clipboard,
	canCopyImg: "clipboard" in navigator && "write" in navigator.clipboard,
	isTouch: matchMedia("(hover: none), (pointer: coarse)").matches,
};

function copyText(text) {
	if(env.canCopy) navigator.clipboard.writeText(text);
	else {
		// polyfill
		const input = document.createElement("input");
		document.body.appendChild(input);
		input.value = text;
		input.select();
		document.execCommand("copy");
		document.body.removeChild(input);
	}
}

export async function copyImage() {
	const blob = await getBlob();
	return navigator.clipboard.write([
		// Directly using `Promise<Blob>` is supported only for Chrome 97+,
		// so we await for the blob first and then use it.
		new ClipboardItem({ "image/png": blob }),
	]);
}

export function CopyButton(label, factory, cls, dis) {
	return {
		$template: "#copyBtn",
		cls,
		label,
		dis: dis === undefined ? false : dis,
		done: false,
		async copy() {
			const result = await factory();
			if(typeof result == "string") copyText(result);
			this.done = true;
			setTimeout(() => this.done = false, 1000);
		},
	};
}