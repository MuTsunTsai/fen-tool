import { inferDimension } from "../meta/fen.mjs";
import { getDimensions, makeOption } from "../meta/option";

const script = document.currentScript;
const apiURL = new URL("api/", script.src);
const selector = "img[fen]";

const frame = document.createElement("iframe");
frame.style.display = "none";

let currentConfig;

function setup(img) {
	const channel = new MessageChannel();
	channel.port1.onmessage = event => {
		img.src = event.data;
		img.title = currentConfig.getTitle(fen, img.dataset);
	};
	const fen = img.getAttribute("fen");
	const options = makeOption(Object.assign({}, currentConfig.getDefault(), img.dataset));
	const dim = inferDimension(fen);
	if(dim) Object.assign(options, dim);
	const { w, h } = getDimensions(options);
	img.width = w;
	img.height = h;
	frame.contentWindow.postMessage({ fen, options }, "*", [channel.port2]);
}

function check(node) {
	if(node instanceof Element) {
		if(node.matches(selector)) setup(node);
		else node.querySelectorAll(selector).forEach(img => setup(img));
	}
}

export async function init(config) {
	currentConfig = config;
	document.head.appendChild(frame); // sounds funny but works
	await new Promise(resolve => {
		const handler = event => {
			if(event.source != frame.contentWindow) return;
			removeEventListener("message", handler);
			resolve();
		}
		addEventListener("message", handler);
		frame.src = apiURL.toString();
	});

	const doc = document.documentElement;
	new MutationObserver(list => {
		for(const record of list) {
			if(record.type == "attributes") {
				const name = record.attributeName.toLowerCase();
				const isData = name.startsWith("data")
				if(record.target == script && isData) check(document);
				if(record.target.nodeName == "IMG" && (name == "fen" || isData)) setup(record.target);
			} else {
				for(const node of record.addedNodes) check(node);
			}
		}
	}).observe(doc, {
		childList: true,
		attributes: true,
		subtree: true
	});

	check(doc);
}