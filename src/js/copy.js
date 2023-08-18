import { getBlob } from "./render";
import { env } from "./meta/env";

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

export async function readText() {
	if(env.canPaste) return await navigator.clipboard.readText();
	else {
		alert(`Pasting text is not enabled in your browser.\nIf you're using Firefox on desktops or Firefox Nightly on Android, this can be enabled by the following.\n1. Visit "about:config" in your address bar.\n2. Search for "dom.events.asyncClipboard.readText".\n3. Toggle its value to true.\n4. Reload this tool.`);
		throw true;
	}
}