import { rotate, invert, parseXY, shift, mirror, parseFEN, makeForsyth } from "../fen";
import { P, SQ, toNormalPiece, setPiece, movePiece, exchange } from "./base";

export function makeTwin(fen, text) {
	const board = parseFEN(fen);
	// Remove spaces for ease of splitting into commands
	const commands = text
		.replace(/(mirror|shift|rotate) /g, "$1")
		.replace(/ ==&gt; /g, "==&gt;")
		.split(" ");
	for(const command of commands) {
		processTwinCommand(board, command);
	}
	return { fen: makeForsyth(board), board };
}

const TW_MOVE = new RegExp(`^[nwb]${P}(${SQ})--&gt;(${SQ})$`);
const TW_EXCHANGE = new RegExp(`^[nwb]${P}(${SQ})&lt;--&gt;[nwb]${P}(${SQ})$`);
const TW_ADD_REMOVE = new RegExp(`^([+-]?)([nwb])(${P})(${SQ})$`);
const TW_SUBSTITUTE = new RegExp(`^(${P})==&gt;(${P})$`);
const TW_MIRROR = new RegExp(`^mirror(${SQ})&lt;--&gt;(${SQ})$`);
const TW_SHIFT = new RegExp(`^shift(${SQ})==&gt;(${SQ})$`);
const TW_ROTATE = /^rotate(90|180|270)$/;

function processTwinCommand(board, command) {
	for(const process of [processMove, processExchange, processAddRemove,
		processMirror, processShift, processSubstitute, processRotate, processPolish]) {
		if(process(command, board)) return;
	}
}

function processMove(command, board) {
	const arr = command.match(TW_MOVE);
	if(!arr) return false;
	movePiece(board, arr[1], arr[2]);
	return true;
}

function processExchange(command, board) {
	const arr = command.match(TW_EXCHANGE);
	if(!arr) return false;
	exchange(board, arr[1], arr[2]);
	return true;
}

function processAddRemove(command, board) {
	const arr = command.match(TW_ADD_REMOVE);
	if(!arr) return false;
	if(arr[1] == "+" || arr[1] == "") setPiece(board, arr[4], arr[3], arr[2]);
	else setPiece(board, arr[4], "");
	return true;
}

function processMirror(command, board) {
	const arr = command.match(TW_MIRROR);
	if(!arr) return false;
	let d;
	const from = parseXY(arr[1]);
	const to = parseXY(arr[2]);
	if(from.x == to.x) d = "|";
	else if(from.y == to.y) d = "-";
	else if((from.x - to.x) * (from.y - to.y) > 0) d = "\\";
	else d = "/";
	replace(board, mirror(board, d));
	return true;
}

function processShift(command, board) {
	const arr = command.match(TW_SHIFT);
	if(!arr) return false;
	const from = parseXY(arr[1]);
	const to = parseXY(arr[2]);
	replace(board, shift(board, to.x - from.x, to.y - from.y));
	return true;
}

function processSubstitute(command, board) {
	const arr = command.match(TW_SUBSTITUTE);
	if(!arr) return false;
	const From = toNormalPiece(arr[1]), from = From.toLowerCase();
	const To = toNormalPiece(arr[2]), to = To.toLowerCase();
	for(let i = 0; i < board.length; i++) {
		if(board[i] == From) board[i] = To;
		if(board[i] == from) board[i] = to;
		if(board[i] == "-" + from) board[i] = "-" + to;
	}
	return true;
}

function processRotate(command, board) {
	const arr = command.match(TW_ROTATE);
	if(!arr) return false;
	replace(board, rotate(board, getRotate(arr[1])));
	return true;
}

function processPolish(command, board) {
	if(command != "PolishType") return false;
	replace(board, invert(board));
	return true;
}

function replace(board, newBoard) {
	board.length = 0;
	board.push(...newBoard);
}

function getRotate(text) {
	if(text == "90") return -1;
	if(text == "180") return 2;
	return 1;
}
