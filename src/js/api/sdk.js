
const globalOptions = document.currentScript.dataset;

const frame = document.createElement("iframe");
frame.style.display = "none";
document.body.appendChild(frame);

const frameReady = new Promise(resolve => {
	const handler = event => {
		if(event.source != frame.contentWindow) return;
		removeEventListener("message", handler);
		resolve();
	}
	addEventListener("message", handler);
	frame.src = "https://mutsuntsai.github.io/fen-tool/api/";
	// frame.src = "http://localhost:3000/api/";
});

async function init() {
	await frameReady;
	document.querySelectorAll("img[fen]").forEach(img => {
		const channel = new MessageChannel();
		channel.port1.onmessage = event => {
			img.src = event.data;
		};
		const fen = img.getAttribute("fen");
		const options = Object.assign({}, globalOptions, img.dataset);
		frame.contentWindow.postMessage({ fen, options }, "*", [channel.port2]);
	});
}
init();
