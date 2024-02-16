import { parseSquare } from "../fen";
import { exchange, setPiece, P, SQ, movePiece } from "./base";

const EF_ADD = new RegExp(String.raw`^\+(?<c>[nwb])(?<is>${P})(?<at>${SQ})(=(?<p>${P}))?$`);
const EF_REMOVE = new RegExp(String.raw`^-([nwb]${P})?(?<at>${SQ})$`);
const EF_MOVE = new RegExp(`^(?<c>[nwb])${P}(?<from>${SQ})-&gt;(?<to>${SQ})(=(?<p>${P}))?$`);
const EF_SWAP = new RegExp(`^${P}(?<from>${SQ})&lt;-&gt;${P}(?<to>${SQ})$`);
const EF_CHANGE = new RegExp(`^(?<at>${SQ})=(?<c>[nwb])?(?:r?(?<p>${P}))?$`);
const EF_IMITATOR = new RegExp(`^I${SQ}(,${SQ})*$`);

export function makeEffect(board, extra, imitators) {
	let g = extra.match(EF_ADD)?.groups;
	if(g) return setPiece(board, g.at, g.p || g.is, g.c);

	g = extra.match(EF_REMOVE)?.groups;
	if(g) return setPiece(board, g.at, "");

	g = extra.match(EF_MOVE)?.groups;
	if(g) {
		movePiece(board, g.from, g.to);
		if(g.p) setPiece(board, g.to, g.p, g.c);
		return;
	}

	g = extra.match(EF_SWAP)?.groups;
	if(g) return exchange(board, g.from, g.to);

	g = extra.match(EF_CHANGE)?.groups;
	if(g) return setPiece(board, g.at, g.p || getPiece(board, g.at), g.c || getColor(board, g.at));

	g = extra.match(EF_IMITATOR);
	if(g) {
		imitators.push(...extra.match(new RegExp(SQ, "g")));
		for(const sq of imitators) setPiece(board, sq, "I", "n");
	}
}

function getPiece(board, at) {
	const p = board[parseSquare(at)];
	return p.match(new RegExp(P, "i"))[0].toUpperCase();
}

function getColor(board, at) {
	const p = board[parseSquare(at)];
	if(P.startsWith("-")) return "n";
	return p == p.toLowerCase() ? "b" : "w";
}
