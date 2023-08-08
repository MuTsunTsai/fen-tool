import { makeForsyth, parseSquare } from "../fen.mjs";
import { createAbbrExp } from "../regex.mjs";
import { Commands, P, SQ } from "./base.mjs";

const colors = ["1Black", "1Neutral", "1White"].map(createAbbrExp).join("|");
const specs = [
	"1Chameleon", "2FrischAuf", "2Functionary", "2HalfNeutral",
	"2HurdleColourChanging", "1Jigger", "1Kamikaze", "1Magic",
	"2Paralysing", "2Protean", "1Royal", "1Uncapturable", "1Volage",
].map(createAbbrExp).join("|");

const onePieceList = `(?<p>${P})(?<sq>(?:${SQ})+)`;
const oneColor = String.raw`\s+(?<c>${colors})(?:\s+(?:${specs}))?(?<l>(?:\s+${onePieceList})+)`;
const pieceCommand = String.raw`${createAbbrExp("2pieces")}(?:${oneColor})+(?=\s+(?:${Commands})|$)`;

/**
 * @param {string} input 
 */
export function parsePieceCommand(input) {
	const commands = input.match(new RegExp(pieceCommand, "ig"));
	if(!commands) return null;
	const board = Array.from({ length: 64 }, _ => "");
	for(const command of commands) {
		const colorLists = command.match(new RegExp(oneColor, "ig"));
		for(const colorList of colorLists) {
			const g = colorList.match(new RegExp(oneColor, "i")).groups;
			const color = g.c[0].toLowerCase();
			const lists = g.l.match(new RegExp(onePieceList, "ig"));
			for(const list of lists) {
				const g = list.match(new RegExp(onePieceList, "i")).groups;
				const p = g.p.toUpperCase();
				const squares = g.sq.match(new RegExp(SQ, "g"));
				for(const sq of squares) board[parseSquare(sq)] = getPieceName(color, p);
			}
		}
	}
	return makeForsyth(board);
}

function getPieceName(color, p) {
	if(p.length == 2) p = "." + p;
	if(color == "n") return "=" + p;
	const isWhite = color == "w";
	if(!p.match(/[A-Z]/)) return (isWhite ? "+" : "-") + p;
	return isWhite ? p : p.toLowerCase();
}