import { INIT_SQ_COUNT } from "../constants";
import { Color } from "../enum";
import { emptyBoard, makeForsyth, parseSquare } from "../fen";
import { createAbbrExp } from "../regex";
import { Commands, P, SQ } from "./base";

const colors = ["1Black", "1Neutral", "1White"].map(createAbbrExp).join("|");
const specs = [
	"1Chameleon", "2FrischAuf", "2Functionary", "2HalfNeutral",
	"2HurdleColourChanging", "1Jigger", "1Kamikaze", "1Magic",
	"2Paralysing", "2Protean", "1Royal", "1Uncapturable", "1Volage",
].map(createAbbrExp).join("|");

const onePieceList = `(?<p>${P})(?<sq>(?:${SQ})+)`;
const oneColor = String.raw`\s+(?<c>${colors})(?:\s+(?:${specs}))?(?<l>(?:\s+${onePieceList})+)`;
export const pieceCommand = String.raw`${createAbbrExp("2pieces")}(?:${oneColor})+(?=\s+(?:${Commands})|$)`;

export function parsePieceCommand(input: string): string | null {
	const commands = input.match(new RegExp(pieceCommand, "ig"));
	if(!commands) return null;
	const board = emptyBoard(INIT_SQ_COUNT);
	for(const command of commands) {
		const colorLists = command.match(new RegExp(oneColor, "ig"))!;
		for(const colorList of colorLists) {
			const g = colorList.match(new RegExp(oneColor, "i"))!.groups!;
			const color = g.c[0].toLowerCase();
			const lists = g.l.match(new RegExp(onePieceList, "ig"))!;
			for(const list of lists) {
				const g2 = list.match(new RegExp(onePieceList, "i"))!.groups!;
				const p = g2.p.toUpperCase();
				const squares = g2.sq.match(new RegExp(SQ, "g"))!;
				for(const sq of squares) board[parseSquare(sq)] = getPieceName(color as Color, p);
			}
		}
	}
	return makeForsyth(board);
}

function getPieceName(color: Color, p: string): string {
	if(p.length == 2) p = "." + p;
	if(color == Color.neutral) return "=" + p;
	const isWhite = color == Color.white;
	if(!p.match(/[A-Z]/)) return (isWhite ? "+" : "-") + p;
	return isWhite ? p : p.toLowerCase();
}
