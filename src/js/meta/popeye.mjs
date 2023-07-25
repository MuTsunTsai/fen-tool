import { INIT_FEN, makeFEN, parseSquare, parseFEN, rotate, invert, parseXY, shift, mirror } from "./fen.mjs";
import { createAbbrExp, createAbbrReg } from "./regex.mjs";

const SQ = `[a-h][1-8]`;
const P = `(?:[0-9A-Z][0-9A-Z]|[A-Z])`;
const Effect = String.raw`\[[^\]]+\]`;
const Twin = String.raw`(\+)?[a-z]\) (\S[ \S]+\S)`;
const Normal = `(?:[nwb])?r?${P}?(?<from>${SQ})[-*](?<to>${SQ})(?:-(?<then>${SQ}))?`;
const Promotion = `=(?<pc>[nwb])?(?<p>${P})`;

// Note that effect could occur before or after promotion notation.
// This is one thing that is somewhat inconsistent in Popeye output.
const Main = String.raw`(?:(?<move>0-0(?:-0)?|${Normal})(?:${Effect})*(?:${Promotion})?(?:=(?<cc>[nwb]))?(?<ep> ep\.)?)(?:${Effect})*`;
const Main_raw = Main.replace(/\?<[^>]+>/g, "");
const Step = String.raw`(?<count>\d+\.(?:\.\.)?)?(?<main>${Main_raw}(?:\/${Main_raw})*)(?: [+#=])?`;

const TWIN = new RegExp(Twin);
const MAIN = new RegExp(Main);
const STEP = new RegExp(Step);

export function formatSolution(input, initFEN, output) {
	return parseSolution(input, initFEN, output, makeStep);
}

export function parseSolution(input, initFEN, output, factory) {
	if(!initFEN) return output;
	// console.log(output);

	const { duplex, halfDuplex, initImitators } = parseInput(input);

	const stip = getStipulation(input);
	const ordering = inferMoveOrdering(stip, halfDuplex);
	let currentOrdering = ordering;
	const isPG = (/dia/i).test(stip);
	const init = addImitator(isPG ? INIT_FEN : toNormalFEN(initFEN), initImitators);
	let lastPosition = init;
	let error = false;
	const stack = [];
	let board = parseFEN(init);
	let imitators = initImitators?.concat();

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
		// console.log(text);
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
				const fen = makeFEN(board);
				lastPosition = fen;
				return factory(text, fen);
			}

			solutionPrinted = true;
			const match = text.match(STEP);
			const count = match.groups.count;
			if(count) {
				const index = stack.findIndex(s => s.move == count || parseInt(s.move) > parseInt(count));
				if(index >= 0) {
					// Retract
					const fen = index > 0 ? stack[index - 1].fen : init;
					board = parseFEN(fen);
					if(imitators) imitators = (index > 0 ? stack[index - 1].imitators : initImitators).concat();
					stack.length = index;
				}
			}
			const color = currentOrdering[!count || count.endsWith("...") ? 1 : 0];

			// Clear all imitators first
			if(imitators) {
				for(const sq of imitators) setPiece(board, sq, "");
				imitators.length = 0;
			}

			// Make main moves; could have more than one (e.g. Rokagogo)
			const moves = match.groups.main.split("/");
			for(let move of moves) {
				const m = move.match(MAIN);
				makeMove(board, color, m.groups, imitators);

				// Handle effects
				const effects = move.match(/(?<=\[)[^\[\]]+(?=\])/g);
				if(effects) {
					effects.forEach(effect => makeEffect(board, effect, imitators));
				}
			}

			const fen = makeFEN(board);
			if(count) stack.push({ move: count, color, fen, imitators: imitators?.concat() })
			return factory(text, fen);
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

function addImitator(fen, imitators) {
	if(!imitators) return fen;
	const board = parseFEN(fen);
	for(const sq of imitators) {
		board[parseSquare(sq)] = "-c";
	}
	return makeFEN(board);
}

const IMITATOR = new RegExp(String.raw`\bimit\w*\s+(?:${SQ})+`, "ig");

const Commands = ["condition", "option", "stipulation", "sstipulation", "forsyth", "pieces", "twin"];
const COMMANDS = new RegExp(Commands.map(createAbbrExp).join("|"), "ig");
const DUPLEX = createAbbrReg("duplex");
const HALF_DUPLEX = createAbbrReg("halfDuplex");

function parseInput(input) {
	input = input
		.replace(/\n/g, " ")
		.replace(COMMANDS, "\n$&")
		.split("\n");
	const options = input.filter(c => c.match(/^opti/i)).join(" ");
	const conditions = input.filter(c => c.match(/^cond/i)).join(" ");
	return {
		initImitators: conditions.match(IMITATOR)?.join(" ").match(new RegExp(SQ, "g")),
		duplex: DUPLEX.test(options),
		halfDuplex: HALF_DUPLEX.test(options),
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

function makeMove(board, color, g, imitators) {
	let to, p;
	if(g.move.startsWith("0-0")) {
		const rank = color == "w" ? "1" : "8";
		const sq = g.move == "0-0" ? ["g", "h", "f"] : ["c", "a", "d"];
		movePiece(board, "e" + rank, sq[0] + rank);
		p = movePiece(board, sq[1] + rank, to = sq[2] + rank);
	} else {
		p = movePiece(board, g.from, to = g.to);
		if(g.ep) setPiece(board, getEpSquare(g.to), ""); // en passant
		if(g.then) movePiece(board, g.to, to = g.then); // Take&Make
	}
	if(g.p == "I") {
		imitators.push(to);
		setPiece(board, to, "I", "n");
	} else if(g.p) {
		setPiece(board, to, p = g.p, g.pc ? g.pc : color); // promotion & Einstein
	}
	if(g.cc) setPiece(board, to, p, g.cc); // Volage
}

function getEpSquare(sq) {
	return sq.replace("3", "4").replace("6", "5");
}

function movePiece(board, from, to) {
	from = parseSquare(from);
	to = parseSquare(to);
	board[to] = board[from];
	board[from] = "";
	return board[to];
}

function exchange(board, from, to) {
	from = parseSquare(from);
	to = parseSquare(to);
	const temp = board[to];
	board[to] = board[from];
	board[from] = temp;
}

function setPiece(board, sq, piece, color) {
	piece = toNormalPiece(piece);
	if(color == "w") piece = piece.toUpperCase();
	if(color == "b") piece = piece.toLowerCase();
	if(color == "n") piece = "-" + piece.toLowerCase();
	board[parseSquare(sq)] = piece;
}

const EF_ADD = new RegExp(String.raw`^\+(?<c>[nwb])(?<is>${P})(?<at>${SQ})(=(?<p>${P}))?$`);
const EF_REMOVE = new RegExp(String.raw`^-([nwb]${P})?(?<at>${SQ})$`);
const EF_MOVE = new RegExp(`^(?<c>[nwb])${P}(?<from>${SQ})-&gt;(?<to>${SQ})(=(?<p>${P}))?$`);
const EF_SWAP = new RegExp(`^${P}(?<from>${SQ})&lt;-&gt;${P}(?<to>${SQ})$`);
const EF_CHANGE = new RegExp(`^(?<at>${SQ})=(?<c>[nwb])?(?:r?(?<p>${P}))?$`);
const EF_IMITATOR = new RegExp(`^I${SQ}(,${SQ})*$`);

function makeEffect(board, extra, imitators) {
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
		return;
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

function makeStep(text, fen) {
	return `<span class="step btn btn-secondary px-1 py-0" data-fen="${fen}">${text}</span>`
}

const FEN_TOKEN = new RegExp(String.raw`/|\d+|[+-=]?${P}`, "ig");

export function toNormalFEN(fen) {
	const arr = fen.match(FEN_TOKEN);
	return arr.map(t => {
		if(t == "/" || t.match(/^\d+$/)) return t;
		if(t.startsWith("+")) t = t.substring(1).toUpperCase();
		if(t.startsWith("-")) t = t.substring(1).toLowerCase();
		if(t.startsWith("=")) t = "-" + t.substring(1).toLowerCase();
		return toNormalPiece(t);
	}).join("");
}

export const pieceMap = {
	"C": ["I"],
	"N": ["S"],
};

function toNormalPiece(p) {
	for(const key in pieceMap) {
		for(const s of pieceMap[key]) {
			p = p.replace(s, key).replace(s.toLowerCase(), key.toLowerCase());
		}
	}
	return p;
}
