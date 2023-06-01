
const frame = document.createElement("iframe");

const frameReady = new Promise(resolve => {
	frame.onmessage = resolve;
	frame.src = "https://mutsuntsai.github.io/fen-tool/api/";
});

async function init() {
	await frameReady;
	document.querySelectorAll("img[fen]").forEach(img => {
		const channel = new MessageChannel();
		channel.port1.onmessage = event => {
			img.src = event.data;
		};
		frame.postMessage(img.getAttribute("fen"), [channel.port2]);
	});
}
init();
