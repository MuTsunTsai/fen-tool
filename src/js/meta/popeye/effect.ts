
import { parseSquare } from "../fen";
import { exchange, setPiece, P, SQ, movePiece } from "./base";
import { Color } from "../enum";

const EF_ADD = new RegExp(String.raw`^\+(?<c>[nwb])(?<is>${P})(?<at>${SQ})(=(?<p>${P}))?$`);
const EF_REMOVE = new RegExp(String.raw`^-([nwb]${P})?(?<at>${SQ})$`);
const EF_MOVE = new RegExp(`^(?<c>[nwb])${P}(?<from>${SQ})-&gt;(?<to>${SQ})(=(?<p>${P}))?$`);
const EF_SWAP = new RegExp(`^${P}(?<from>${SQ})&lt;-&gt;${P}(?<to>${SQ})$`);
const EF_CHANGE = new RegExp(`^(?<at>${SQ})=(?<c>[nwb])?(?:r?(?<p>${P}))?$`);
const EF_IMITATOR = new RegExp(`^I${SQ}(,${SQ})*$`);

export function makeEffect(board: Board, extra: string, imitators: string[]): string | void {
	let g = extra.match(EF_ADD)?.groups;
	if(g) return setPiece(board, g.at, g.p || g.is, g.c as Color);

	g = extra.match(EF_REMOVE)?.groups;
	if(g) return setPiece(board, g.at, "");

	g = extra.match(EF_MOVE)?.groups;
	if(g) {
		movePiece(board, g.from, g.to);
		if(g.p) setPiece(board, g.to, g.p, g.c as Color);
		return;
	}

	g = extra.match(EF_SWAP)?.groups;
	if(g) return exchange(board, g.from, g.to);

	g = extra.match(EF_CHANGE)?.groups;
	if(g) {
		return setPiece(board, g.at,
			g.p || getPiece(board, g.at),
			g.c as Color || getColor(board, g.at)
		);
	}

	if(extra.match(EF_IMITATOR)) {
		imitators.push(...extra.match(new RegExp(SQ, "g"))!);
		for(const sq of imitators) setPiece(board, sq, "I", Color.neutral);
	}
}

function getPiece(board: Board, at: string): string {
	const p = board[parseSquare(at)];
	return p.match(new RegExp("^(\\*\\d)?" + P + "$", "i"))![0].toUpperCase();
}

function getColor(board: Board, at: string): Color {
	const p = board[parseSquare(at)];
	if(P.startsWith("-")) return Color.neutral;
	return p == p.toLowerCase() ? Color.black : Color.white;
}
