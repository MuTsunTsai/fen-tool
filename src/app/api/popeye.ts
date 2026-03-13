import { PopeyeBoardElement } from "./popeye-board";
import { PopeyeSolutionElement } from "./popeye-solution";

const script = document.currentScript as HTMLScriptElement;
const origin = new URL(script.src).origin;
const apiURL = origin + "/fen-tool/api/";

// Create hidden iframe for asset loading via Service Worker cache
const frame = document.createElement("iframe");
frame.style.display = "none";
document.head.appendChild(frame);

// Wait for iframe ready, then register WebComponents
const ready = new Promise<void>(resolve => {
	const handler = (event: MessageEvent): void => {
		if(event.source !== frame.contentWindow) return;
		removeEventListener("message", handler);
		resolve();
	};
	addEventListener("message", handler);
	frame.src = apiURL;
});

ready.then(() => {
	PopeyeBoardElement.iframe = frame;
	PopeyeBoardElement.defaults = script.dataset;
	customElements.define("popeye-board", PopeyeBoardElement);
	customElements.define("popeye-solution", PopeyeSolutionElement);
});
