import { inferDimension } from "app/meta/fen";
import { getDimensions, makeOption } from "app/meta/option";

import type { BoardOptions } from "app/meta/option";

const script = document.currentScript as HTMLScriptElement;
const selector = "img[fen]";

const frame = document.createElement("iframe");
frame.style.display = "none";

interface SdkConfig {
	getDefault: () => Partial<BoardOptions>;
	getTitle: (fen: string, dataSet: DOMStringMap) => string;
}

let currentConfig: SdkConfig;

function setup(img: HTMLImageElement): void {
	const channel = new MessageChannel();
	channel.port1.onmessage = event => {
		img.src = event.data;
		img.title = currentConfig.getTitle(fen, img.dataset);
	};
	const fen = img.getAttribute("fen")!;
	const options = makeOption(Object.assign({}, currentConfig.getDefault(), img.dataset));
	const dim = inferDimension(fen);
	if(dim) Object.assign(options, dim);
	const { w, h } = getDimensions(options);
	img.width = w;
	img.height = h;
	frame.contentWindow!.postMessage({ fen, options }, "*", [channel.port2]);
}

function check(node: Node): void {
	if(node instanceof Element) {
		if(node.matches(selector)) setup(node as HTMLImageElement);
		else node.querySelectorAll(selector).forEach(img => setup(img as HTMLImageElement));
	}
}

export async function init(config: SdkConfig): Promise<void> {
	const origin = new URL(script.src).origin;
	const apiURL = new URL(origin + "/fen-tool/api/");
	currentConfig = config;
	document.head.appendChild(frame); // sounds funny but works
	await new Promise<void>(resolve => {
		const handler = (event: MessageEvent): void => {
			if(event.source != frame.contentWindow) return;
			removeEventListener("message", handler);
			resolve();
		};
		addEventListener("message", handler);
		frame.src = apiURL.toString();
	});

	const doc = document.documentElement;
	new MutationObserver(list => {
		for(const record of list) {
			if(record.type == "attributes") {
				const name = record.attributeName!.toLowerCase();
				const isData = name.startsWith("data");
				if(record.target == script && isData) check(document.body);
				if(record.target.nodeName == "IMG" && (name == "fen" || isData)) {
					setup(record.target as HTMLImageElement);
				}
			} else {
				for(const node of record.addedNodes) check(node);
			}
		}
	}).observe(doc, {
		childList: true,
		attributes: true,
		subtree: true,
	});

	check(doc);
}

export function redrawSDK(): void {
	check(document.body);
}
