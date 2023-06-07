export const assets = document.createElement("canvas");
const ctx = assets.getContext("2d");

export async function loadAsset(path, options) {
	const { set, size } = options;
	const pieces = new Image();
	const symbols = new Image();
	await Promise.all([
		new Promise(resolve => {
			pieces.onload = resolve;
			pieces.src = `${path}/${set}${size}.png`;
		}),
		new Promise(resolve => {		
			symbols.onload = resolve;
			symbols.src = `${path}/symbol${size}.png`;
		}),
	]);
	assets.width = size * 3;
	assets.height = size * 12;
	ctx.drawImage(pieces, 0, 0);
	ctx.drawImage(symbols, 0, size * 6);
	return assets;
}