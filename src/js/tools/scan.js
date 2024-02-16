import { search } from "../store";
import { alert } from "../meta/dialogs";

const supportedTypes = ["image/png", "image/jpeg", "image/bmp", "image/webp"];

/** Intercepting images passed in through web share target API */
async function loadImage() {
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

/**
 *
 * @param {Blob} blob
 */
function scan(blob) {
	if(!supportedTypes.includes(blob.type)) {
		alert("Unsupported format.");
		return;
	}

	// TODO
	alert("Image processing under development.");
}

/**
 * Open an image file from input element.
 * @param {HTMLInputElement} input
 */
export function openFile(input) {
	const file = input.files[0];
	input.value = "";
	scan(file);
}
