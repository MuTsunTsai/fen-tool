import { parseSquare } from "../fen.mjs";

export const SQ = `[a-h][1-8]`;
export const P = `(?:[0-9A-Z][0-9A-Z]|[A-Z])`;
const Effect = String.raw`\[[^\]]+\]`;
export const Twin = String.raw`(\+)?[a-z]\) (\S[ \S]+\S)`;
const Normal = `(?:[nwb])?r?${P}?(?<from>${SQ})[-*](?<to>${SQ})(?:-(?<then>${SQ}))?`;
const Promotion = `=(?<pc>[nwb])?(?<p>${P})`;

// Note that effect could occur before or after promotion notation.
// This is one thing that is somewhat inconsistent in Popeye output.
export const Main = String.raw`(?:(?<move>0-0(?:-0)?|${Normal})(?:${Effect})*(?:${Promotion})?(?:=(?<cc>[nwb]))?(?<ep> ep\.)?)(?:${Effect})*`;
const Main_raw = Main.replace(/\?<[^>]+>/g, "");
export const Step = String.raw`(?<count>\d+\.(?:\.\.)?)?(?<main>${Main_raw}(?:\/${Main_raw})*)(?: [+#=])?`;

export function setPiece(board, sq, piece, color) {
	piece = toNormalPiece(piece);
	if(color == "w") piece = piece.toUpperCase();
	if(color == "b") piece = piece.toLowerCase();
	if(color == "n") piece = "-" + piece.toLowerCase();
	board[parseSquare(sq)] = piece;
}

export function movePiece(board, from, to) {
	from = parseSquare(from);
	to = parseSquare(to);
	board[to] = board[from];
	board[from] = "";
	return board[to];
}

export const pieceMap = {
	"C": ["I"],
	"N": ["S"],
};

export function toNormalPiece(p) {
	for(const key in pieceMap) {
		for(const s of pieceMap[key]) {
			p = p.replace(s, key).replace(s.toLowerCase(), key.toLowerCase());
		}
	}
	return p;
}
