import { search } from "app/store";
import { alert } from "app/meta/dialogs";

const supportedTypes = ["image/png", "image/jpeg", "image/bmp", "image/webp"];

/** Intercepting images passed in through web share target API */
async function loadImage(): Promise<void> {
	const index = search.get("image");
	if(index) {
		// Remove search param, preventing re-triggering on reload
		const url = new URL(location.href);
		url.searchParams.delete("image");
		history.replaceState(null, "", url.toString());

		// Load image;
		const response = await fetch("shareImage?image=" + index);
		scan(await response.blob());
	}
}

loadImage();

function scan(blob: Blob): void {
	if(!supportedTypes.includes(blob.type)) {
		alert("Unsupported format.");
		return;
	}

	// TODO
	alert("Image processing under development.");
}

/**
 * Open an image file from input element.
 */
export function openFile(input: HTMLInputElement): void {
	const file = input.files?.[0];
	input.value = "";
	if(file) scan(file);
}
