const assets = document.createElement("canvas");
const ctx = assets.getContext("2d");
const imgs = new Map();

/** One must call this function after {@link loadAsset}. */
export function getAsset(options, dpr) {
	const key = options.set + (options.size * dpr);
	return imgs.get(key);
}

export async function loadAsset(path, options, dpr) {
	const key = options.set + (options.size * dpr);
	if(imgs.has(key)) return imgs.get(key);
	const url = await load(path, options, dpr);
	const img = await loadImg(url);
	imgs.set(key, img);
	return img;
}

async function load(path, options, dpr) {
	const { set, size } = options;
	if(dpr != 1) path += "/x" + dpr;
	const [pieces, symbols] = await Promise.all([
		loadImg(`${path}/${set}${size}.png`),
		loadImg(`${path}/symbol${size}.png`),
	]);
	assets.width = size * dpr * 3;
	assets.height = size * dpr * 12;
	ctx.drawImage(pieces, 0, 0);
	ctx.drawImage(symbols, 0, size * dpr * 6);
	return assets.toDataURL();
}

function loadImg(file) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = file;
	});
}