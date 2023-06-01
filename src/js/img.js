import { drawPiece } from "./draw";
import { parseFEN } from "./fen.mjs";

const options = {
	uncolored: false,
	inverted: false,
	grayBG: false,
	blackWhite: false,
	knightOffset: .6,
	SN: false,
	size: 44,
	set: "1echecs",
};

const sizes = [26, 32, 38, 44];
const sets = ["1echecs", "alpha", "goodCompanion", "merida", "skak"];

const url = new URL(location.href);
const squares = parseFEN(url.searchParams.get("fen") || "8/8/8/8/8/8/8/8");

const size = Number(url.searchParams.get("size"));
if(sizes.includes(size)) options.size = size;

const set = url.searchParams.get("set");
if(sets.includes(set)) options.set = set;

const offset = Number(url.searchParams.get("knightOffset"));
if(0 < offset && offset < 1) options.knightOffset = offset;

for(const key of ["uncolored", "inverted", "grayBG", "blackWhite"]) {
	if(url.searchParams.has(key)) options[key] = true;
}

const CN = document.getElementById("CN");
const ctx = CN.getContext("2d");
CN.width = CN.height = options.size * 8 + 2;

const img = new Image();
img.onload = draw;
img.src = `../assets/${options.set}${options.size}.png`;

function draw() {
	const full = 8 * options.size + 2;
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, full, full);
	ctx.font = `${options.size - 4}px arial`;
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const bg = options.uncolored || options.inverted == Boolean((i + j) % 2) ? 1 : 0;
			drawPiece(ctx, img, i, j, squares[i * 8 + j], bg, options);
		}
	}
}
