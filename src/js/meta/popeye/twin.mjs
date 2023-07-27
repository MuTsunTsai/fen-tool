import { rotate, invert, parseXY, shift, mirror } from "../fen.mjs";
import { P, SQ, toNormalPiece, setPiece, movePiece } from "./base.mjs";

export function makeTwin(board, text) {
	// Remove spaces for ease of splitting into commands
	const commands = text
		.replace(/(mirror|shift|rotate) /g, "$1")
		.replace(/ ==&gt; /g, "==&gt;")
		.split(" ");
	for(const command of commands) {
		processTwinCommand(board, command);
	}
}

const TW_MOVE = new RegExp(`^[nwb]${P}(${SQ})--&gt;(${SQ})$`);
const TW_EXCHANGE = new RegExp(`^[nwb]${P}(${SQ})&lt;--&gt;[nwb]${P}(${SQ})$`);
const TW_ADD_REMOVE = new RegExp(`^([+-]?)([nwb])(${P})(${SQ})$`);
const TW_SUBSTITUTE = new RegExp(`^(${P})==&gt;(${P})$`);
const TW_MIRROR = new RegExp(`^mirror(${SQ})&lt;--&gt;(${SQ})$`);
const TW_SHIFT = new RegExp(`^shift(${SQ})==&gt;(${SQ})$`);
const TW_ROTATE = /^rotate(90|180|270)$/;

function processTwinCommand(board, command) {
	let arr = command.match(TW_MOVE);
	if(arr) return movePiece(board, arr[1], arr[2]);

	arr = command.match(TW_EXCHANGE);
	if(arr) return exchange(board, arr[1], arr[2]);

	arr = command.match(TW_ADD_REMOVE);
	if(arr) {
		if(arr[1] == "+" || arr[1] == "") setPiece(board, arr[4], arr[3], arr[2]);
		else setPiece(board, arr[4], "");
		return;
	}

	arr = command.match(TW_MIRROR);
	if(arr) {
		let d;
		const from = parseXY(arr[1]);
		const to = parseXY(arr[2]);
		if(from.x == to.x) d = "|";
		else if(from.y == to.y) d = "-";
		else if((from.x - to.x) * (from.y - to.y) > 0) d = "\\";
		else d = "/";
		replace(board, mirror(board, d));
		return;
	}

	arr = command.match(TW_SHIFT);
	if(arr) {
		const from = parseXY(arr[1]);
		const to = parseXY(arr[2]);
		replace(board, shift(board, to.x - from.x, to.y - from.y));
		return;
	}

	arr = command.match(TW_SUBSTITUTE);
	if(arr) {
		const From = toNormalPiece(arr[1]), from = From.toLowerCase();
		const To = toNormalPiece(arr[2]), to = To.toLowerCase();
		for(let i = 0; i < board.length; i++) {
			if(board[i] == From) board[i] = To;
			if(board[i] == from) board[i] = to;
			if(board[i] == "-" + from) board[i] = "-" + to;
		}
	}

	arr = command.match(TW_ROTATE);
	if(arr) return replace(board, rotate(board, arr[1] == "90" ? -1 : arr[1] == "180" ? 2 : 1));

	if(command == "PolishType") return replace(board, invert(board));
}

function replace(board, newBoard) {
	board.length = 0;
	board.push(...newBoard);
}