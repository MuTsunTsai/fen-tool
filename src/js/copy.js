import { getBlob } from "./render";
import { env } from "./env";

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
	if(env.canCopyImg) {
		const blob = await getBlob();
		return navigator.clipboard.write([
			// Directly using `Promise<Blob>` is supported only for Chrome 97+,
			// so we await for the blob first and then use it.
			new ClipboardItem({ "image/png": blob }),
		]);
	} else {
		alert(`Image copying is not enabled in your browser.\nIf you're using Firefox, this can be enabled by the following.\n1. Visit "about:config" in your address bar.\n2. Search for "dom.events.asyncClipboard.clipboardItem".\n3. Toggle its value to true.\n4. Reload this tool.`);
		throw true;
	}
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