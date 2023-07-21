import { INIT_FEN, makeFEN, parseSquare, parseFEN } from "./fen.mjs";

const SQ = `[a-h][1-8]`;
const P = `(?:[A-Z]|[0-9A-Z][0-9A-Z])`;
const Twin = String.raw`(\+)?[a-z]\) (\S[ \S]+\S)`;
const Extra = String.raw`(\+)?([nwb])?(${P})(${SQ})(?:=(${P}))?(?:&lt;-&gt;${P}${SQ})?`;
const Main = String.raw`(?:0-0(?:-0)?|(?:[nwb])?(?:${P})?(${SQ})[-*](${SQ})(?:-(${SQ}))?(?:=(${P}))?( ep\.)?)`;
const Step = String.raw`(\d+\.(?:\.\.)?)?(${Main}(?:\/${Main})*)(?:\[(${Extra})\])?(?: [+#=])?`;

const TWIN = new RegExp(Twin);
const MAIN = new RegExp(Main);
const STEP = new RegExp(Step);
const EXTRA = new RegExp(Extra);

export function formatSolution(input, initFEN, output) {
	return parseSolution(input, initFEN, output, makeStep);
}

export function parseSolution(input, initFEN, output, factory) {
	if(!initFEN) return output;

	const { duplex, halfDuplex } = parseOption(input);

	const stip = getStipulation(input);
	const ordering = inferMoveOrdering(stip, halfDuplex);
	let currentOrdering = ordering;
	const isPG = (/dia/i).test(stip);
	const init = isPG ? INIT_FEN : toNormalFEN(initFEN);
	let lastPosition = init;
	let error = false;
	const stack = [];
	let board = parseFEN(init);

	let hasTwin = false;
	output = output
		.replace(/<br>/g, "\n")
		.replace(/a\) \n/, () => {
			hasTwin = true;
			return `${factory("a)", init)}\n`;
		});
	if(!hasTwin) output = output.replace(/^(Popeye.+?)\n/, `$1 ${factory("Beginning", init)}\n`);

	const duplexSeparator = duplex ? getDuplexSeparator(output) : "";
	const duplexSeparatorReg = duplexSeparator ? duplexSeparator.replace(/\n/g, "\\n") + "|" : "";
	const TOKEN = new RegExp(duplexSeparatorReg + `(?:${Twin})|(?:${Step})`, "g");

	// Main replacement
	let solutionPrinted = false;
	output = output.replace(TOKEN, text => {
		if(error) return text;
		try {
			if(text == duplexSeparator) {
				if(solutionPrinted) {
					currentOrdering = flipOrdering(currentOrdering);
				}
				return text;
			}

			// Enter twin
			const twin = text.match(TWIN);
			if(twin) {
				solutionPrinted = false;
				currentOrdering = ordering; // reset
				stack.length = 0;
				board = parseFEN(twin[1] ? lastPosition : init);
				makeTwin(board, twin[2]);
				const fen = makeFEN(board, 8, 8);
				lastPosition = fen;
				return factory(text, fen);
			}

			solutionPrinted = true;
			const match = text.match(STEP);
			if(match[1]) {
				const index = stack.findIndex(s => s.move == match[1] || parseInt(s.move) > parseInt(match[1]));
				if(index >= 0) {
					// Retract
					const fen = index > 0 ? stack[index - 1].fen : init;
					board = parseFEN(fen);
					stack.length = index;
				}
			}
			const color = currentOrdering[!match[1] || match[1].endsWith("...") ? 1 : 0];

			// Make main moves; could have more than one (e.g. Rokagogo)
			const moves = match[2].split("/");
			for(const move of moves) {
				const m = move.match(MAIN);
				makeMove(board, color, m);
			}

			// Handle extra instructions
			const extra = match[13];
			if(extra) makeExtra(board, extra);

			const fen = makeFEN(board, 8, 8);
			if(match[1]) stack.push({ move: match[1], color, fen })
			return factory(match[0], fen);
		} catch(e) {
			// Something is not right. Give up.
			console.log(e, text);
			error = true;
			return text;
		}
	});
	return output.replace(/\n/g, "<br>");
}

export function getStipulation(input) {
	return input.match(/\bstip\w*\s+(\S*(?:\d|[^\d\s]\s+\d+(?:\.[05])?))/i)?.[1].replace(/\s/g, "");
}

/** Try to guess the WB/BW move ordering; this is needed only for castling. */
export function inferMoveOrdering(stip, halfDuplex) {
	// It is assumed there that spaces are removed in stip
	const m = stip.match(/^(\d+-&gt;)?(?:exact-)?(?:(?:ser|pser|phser|semi|reci)-)?(hs|hr|h|s|r)?/i);
	let result;
	if(!m || m[1]) result = "wb";
	else result = m[2] == "h" ? "bw" : "wb";
	return halfDuplex ? flipOrdering(result) : result;
}

function parseOption(input) {
	const options = input
		.replace(/\n/g, " ")
		.replace(/\b(cond|opti|stip|ssti|fors|piec|twin)/ig, "\n$&")
		.split("\n")
		.filter(c => c.match(/^opti/i))
		.join(" ");
	return {
		duplex: /\bdupl/i.test(options),
		halfDuplex: /\bhalf/i.test(options),
	};
}

function flipOrdering(order) {
	return order == "wb" ? "bw" : "wb"
}

function getDuplexSeparator(output) {
	// The idea is to find the maximal gap between solutions.
	const reg = /^\n\n+ +1\./;
	const counts = output
		.replace(/\n\nsolution finished./, "\n  1.") // in case there's no solution for duplex
		.match(/\n\n+[^\n]+/g)
		.filter((e, i, a) => i > 0 && e.match(reg) && a[i - 1].match(reg))
		.map(h => h.match(/^\n+/)[0].length);
	return "\n".repeat(Math.max(...counts));
}

function makeMove(board, color, arr) {
	// console.log(arr);
	if(arr[0].startsWith("0-0")) {
		const rank = color == "w" ? "1" : "8";
		const sq = arr[0] == "0-0" ? ["g", "h", "f"] : ["c", "a", "d"];
		movePiece(board, "e" + rank, sq[0] + rank);
		movePiece(board, sq[1] + rank, sq[2] + rank);
	} else {
		movePiece(board, arr[1], arr[2]);
		if(arr[5]) setPiece(board, getEpSquare(arr[2]), ""); // en passant
		if(arr[3]) movePiece(board, arr[2], arr[3]); // Take&Make
		if(arr[4]) setPiece(board, arr[2], arr[4], color);
	}
}

function getEpSquare(sq) {
	return sq.replace("3", "4").replace("6", "5");
}

function movePiece(board, from, to) {
	from = parseSquare(from);
	to = parseSquare(to);
	board[to] = board[from];
	board[from] = "";
}

function exchange(board, from, to) {
	from = parseSquare(from);
	to = parseSquare(to);
	const temp = board[to];
	board[to] = board[from];
	board[from] = temp;
}

function setPiece(board, sq, piece, color) {
	piece = toNormalFEN(piece);
	if(color == "b") piece = piece.toLowerCase();
	board[parseSquare(sq)] = piece;
}

function makeExtra(board, extra) {
	const arr = extra.match(EXTRA);
	if(arr[1] == "+") {
		setPiece(board, arr[4], arr[5] || arr[3], arr[2]);
	}
}

function makeTwin(board, text) {
	// Remove spaces for ease of splitting into commands
	const commands = text
		.replace(/(mirror|shift|rotate) /g, "$1")
		.replace(/ ==&gt; /g, "==&gt;")
		.split(" ");
	for(const command of commands) {
		processTwinCommand(board, command);
	}
}

const MOVE = /[nwb]${P}(${SQ})--&gt;(${SQ})/;
const EXCHANGE = /[nwb]${P}(${SQ})&lt;--&gt;[nwb]${P}(${SQ})/;
const ADD_REMOVE = /([+-])([nwb])(${P})(${SQ})/;

function processTwinCommand(board, command) {
	let arr = command.match(MOVE);
	if(arr) return movePiece(board, arr[1], arr[2]);

	arr = command.match(EXCHANGE);
	if(arr) return exchange(board, arr[1], arr[2]);

	arr = command.match(ADD_REMOVE);
	if(arr) {
		if(arr[1] == "+") setPiece(board, arr[3], arr[2], arr[1])
		else setPiece(board, arr[3], "");
		return;
	}
}

function makeStep(text, fen) {
	return `<span class="step btn btn-secondary px-1 py-0" data-fen="${fen}">${text}</span>`
}

export function toNormalFEN(fen) {
	return fen.replace(/s/g, "n").replace(/S/g, "N");
}