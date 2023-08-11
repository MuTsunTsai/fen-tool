import { clone } from "../meta/clone.mjs";
import { env } from "../meta/env";
import { SQ } from "../meta/popeye/base.mjs";
import { orthodoxFEN } from "../squares";
import { STOCKFISH, state, status, store } from "../store";
import { importGame, loadModule } from "./play";

// Session
if(state.stockfish.lines.length) {
	const lines = state.stockfish.lines;
	const header = state.stockfish.header;
	state.stockfish.lines = [];
	state.stockfish.header = [];
	loadModule().then(m => {
		module = m;
		state.stockfish.lines = lines;
		state.stockfish.header = header;
	});
}

/** @type {Worker} */
let stockfish;

/** @type {import("../modules/chess.mjs")} */
let module;

/** @type {import("../modules/chess.mjs").Chess} */
let chess;

/** @type {string} */
let fen;

/** @type {Promise<void>} */
let ready;

function cmd(text) {
	stockfish.postMessage(text);
}
window.cmd = cmd; // For dev purpose

const move = `(${SQ})(${SQ})([qrbn]?)`;

const path = "modules/stockfish/";
const suffix = env.thread ? "" : "-single";

const DRAW_THRESHOlD = 1;

// We can't really tell if SharedArrayBuffer is enabled on first launch,
// so we download all files anyway.
const files = [
	`${path}stockfish-nnue-16.js#stockfish-nnue-16.wasm,worker`,
	`${path}stockfish-nnue-16.wasm`,
	`${path}stockfish-nnue-16-single.js#stockfish-nnue-16-single.wasm,worker`,
	`${path}stockfish-nnue-16-single.wasm`,
	`${path}nn-5af11540bbfe.nnue`,
];

function init() {
	if(stockfish) return;
	ready = new Promise(resolve => {
		stockfish = new Worker(`${path}stockfish-nnue-16${suffix}.js#stockfish-nnue-16${suffix}.wasm`);
		stockfish.onmessage = e => {
			const msg = e.data;
			console.log(msg);
			if(msg == "readyok") resolve();
			if(msg.startsWith("info ")) parseInfo(msg.substring(5));
			if(msg.match(new RegExp(`^bestmove ${move}`))) findBest();
		};

		cmd("uci");
		cmd("setoption name Use NNUE value true");
		cmd("setoption Hash 512");
		if(env.thread) {
			cmd("setoption name Threads value " + Math.max(2, navigator.hardwareConcurrency - 4));
		}
		cmd("isready");
	});
}

function parseInfo(info) {
	if(status.stockfish.running != 2) return; // Prevent displaying weird results.

	const multi = info.match(/multipv (\d+)/);
	if(!multi) return;
	const index = Number(multi[1]) - 1;

	const mate = info.match(/mate (-?)(\d+)/);
	const score = info.match(/score cp (-?\d+)/);
	const cp = Number(score && score[1] || 0) / 100;

	if(index == 0) {
		const depth = info.match(/depth (\d+)/);
		if(depth) state.stockfish.depth = depth[1];
		if(mate) {
			const side = (fen.split(" ")[1] == "w") == Boolean(mate[1]) ? "Black" : "White";
			state.stockfish.mate = [side, mate[2]];
		}
		if(score) state.stockfish.score = cp;
	}
	const moves = info.match(new RegExp(`pv (${move}(?: ${move})*)`));
	if(moves) {
		if(state.stockfish.lines[index]?.raw == moves[1]) return;
		const matches = moves[1].split(" ").map(m => m.match(new RegExp(move)));
		state.stockfish.moves = [];
		chess.init(fen);
		for(const move of state.stockfish.header) {
			const m = chess.move(move);
			m.annotation = move.annotation;
		}
		for(const match of matches) {
			const move = chess.move({ from: match[1], to: match[2], promotion: match[3] })
			if(move.san.endsWith("=")) break; // Stockfish keeps going
		}
		const line = {
			rawScore: mate ? (mate[1] ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY) : cp,
			score: mate ? mate[1] + "#" + mate[2] : cp.toFixed(2),
			raw: moves[1],
			moves: chess.state.history.concat(),
			pgn: chess.copyPGN(),
		};
		state.stockfish.lines[index] = line;
	}
	if(store.Stockfish.study) annotate();
}

function annotate() {
	const lines = state.stockfish.lines.filter(l => l && l.moves.length);
	if(lines.length <= 1) return false;
	const at = state.stockfish.header.length;
	lines.forEach(l => l.moves[at] && (l.moves[at].annotation = undefined));
	const win = lines.filter(l => l.rawScore > DRAW_THRESHOlD);
	if(win.length > 1) return false;
	if(win.length == 1) {
		win[0].moves[at].annotation = "!";
		return true;
	}
	const draw = lines.filter(l => l.rawScore > -DRAW_THRESHOlD);
	if(draw.length == 1) {
		draw[0].moves[at].annotation = "!";
		return true;
	}
	return false;
}

function findBest() {
	const depth = store.Stockfish.depth;
	if(!store.Stockfish.study || depth < 4 || !annotate()) {
		status.stockfish.running = 0;
	} else {
		state.stockfish.header = state.stockfish.lines[0].moves.slice(0, state.stockfish.header.length + 2);
		const fen = state.stockfish.header[state.stockfish.header.length - 1].after;
		cmd("position fen " + fen);
		cmd("go depth " + depth);
	}
}

function getThen() {
	const lines = state.stockfish.lines;
	const at = state.stockfish.header.length;
	const win = lines.filter(l => l.rawScore > DRAW_THRESHOlD);
	if(win.length > 1) return win.map(l => l.moves[at]);
	const draw = lines.filter(l => l.rawScore > -DRAW_THRESHOlD);
	return draw.map(l => l.moves[at]);
}

export const Stockfish = {
	async download() {
		gtag("event", "fen_stockfish_download");
		status.stockfish.status = 1;
		if("serviceWorker" in navigator) {
			// First we wait for service worker to finish installing.
			// Otherwise caching won't work.
			await navigator.serviceWorker.ready;
		}
		for(const file of files) {
			const response = await fetch(file);
			if(response.status != 200) {
				alert("Download failed. Please check your network connection.");
				status.stockfish.status = 0;
				return;
			}
		}
		store.Stockfish.downloaded = true;
		status.stockfish.status = 2;
	},
	async analyze() {
		gtag("event", "fen_stockfish_run");
		status.stockfish.running = 1;
		init();
		fen = orthodoxFEN();
		if(!fen) {
			alert("Only orthodox chess is supported.");
			return;
		}
		if(!module) module = await loadModule();
		chess = new module.Chess();
		try {
			chess.init(fen);
		} catch(e) {
			alert("This board is not playable: " + e.message.replace(/^.+:/, "").trim().replace(/[^.]$/, "$&."));
			return;
		}
		await ready;

		state.stockfish = clone(STOCKFISH);
		status.stockfish.running = 2;
		cmd("setoption name MultiPV value " + store.Stockfish.lines);
		cmd("ucinewgame");
		cmd("position fen " + fen);
		cmd("go depth " + store.Stockfish.depth);
	},
	play(line) {
		gtag("event", "fen_stockfish_play");
		state.play.mode = "normal";
		state.tab = 6;
		importGame(line.pgn);
	},
	stop() {
		status.stockfish.running = 3;
		cmd("stop");
	},
	format(moves) {
		return module.formatGame(moves);
	},
	then() {
		const moves = getThen();
		let result = module.format(moves.shift());
		if(moves.length) result += ` (or ${moves.map(m => module.format(m)).join(", ")})`;
		return result;
	}
};
