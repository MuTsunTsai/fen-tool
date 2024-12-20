import { TEMPLATE_SIZE } from "app/meta/constants";

import type { BoardOptions } from "app/meta/option";

const ASSET_HEIGHT = 12;
const SYMBOL_OFFSET = 6;

const assets = document.createElement("canvas");
const ctx = assets.getContext("2d")!;
const imgs = new Map<string, CanvasImageSource>();

/** One must call this function after {@link loadAsset}. */
export function getAsset(options: BoardOptions, dpr: number): CanvasImageSource {
	const key = options.set + options.size * dpr;
	return imgs.get(key)!;
}

export async function loadAsset(path: string, options: BoardOptions, dpr: number): Promise<CanvasImageSource> {
	const key = options.set + options.size * dpr;
	if(imgs.has(key)) return imgs.get(key)!;
	const url = await load(path, options, dpr);
	const img = await loadImg(url);
	imgs.set(key, img);
	return img;
}

async function load(path: string, options: BoardOptions, dpr: number): Promise<string> {
	const { set, size } = options;
	path += "/x" + dpr;
	const [pieces, symbols] = await Promise.all([
		loadImg(`${path}/${set}${size}.png`),
		loadImg(`${path}/symbol${size}.png`),
	]);
	assets.width = size * dpr * TEMPLATE_SIZE;
	assets.height = size * dpr * ASSET_HEIGHT;
	ctx.drawImage(pieces, 0, 0);
	ctx.drawImage(symbols, 0, size * dpr * SYMBOL_OFFSET);
	return assets.toDataURL();
}

function loadImg(file: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = e => reject(e);
		img.src = file;
	});
}
