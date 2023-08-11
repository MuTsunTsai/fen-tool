import { clone } from "../meta/clone.mjs";
import { env } from "../meta/env";
import { SQ } from "../meta/popeye/base.mjs";
import { orthodoxFEN } from "../squares";
import { STOCKFISH, checkStockfishModel, state, status, store } from "../store";
import { importGame, loadModule } from "./play";

// Session
if(state.stockfish.lines.length) {
	const lines = state.stockfish.lines;
	state.stockfish.lines = [];
	loadModule().then(m => {
		module = m;
		state.stockfish.lines = lines;
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

const move = `(${SQ})(${SQ})([qrbn]?)`;

const path = "modules/stockfish/";
const suffix = env.thread ? "" : "-single";
const files = [
	`${path}stockfish-nnue-16${suffix}.js#stockfish-nnue-16${suffix}.wasm,worker`,
	`${path}stockfish-nnue-16${suffix}.wasm`,
	`${path}nn-5af11540bbfe.nnue`,
];

function init() {
	if(stockfish) return;
	ready = new Promise(resolve => {
		stockfish = new Worker(files[0]);
		stockfish.onmessage = e => {
			const msg = e.data;
			console.log(msg);
			if(msg == "readyok") resolve();
			if(msg.startsWith("info ")) parseInfo(msg.substring(5));
			const best = msg.match(new RegExp(`^bestmove (${move})`));
			if(best) findBest(best[1]);
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
	const multi = info.match(/multipv (\d+)/);
	if(!multi) return;
	const index = Number(multi[1]) - 1;

	const mate = info.match(/mate (-?)(\d+)/);
	const score = info.match(/score cp (-?\d+)/);
	const cp = score ? (Number(score[1]) / 100).toFixed(2) : "";

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
		for(const match of matches) {
			const move = chess.move({ from: match[1], to: match[2], promotion: match[3] })
			if(move.san.endsWith("=")) break; // Stockfish keeps going
		}
		const line = {
			score: mate ? mate[1] + "#" + mate[2] : cp,
			raw: moves[1],
			moves: chess.state.history.concat(),
			pgn: chess.copyPGN(),
		};
		state.stockfish.lines[index] = line;
	}
}

function findBest(best) {
	state.stockfish.bestMove = module.format(state.stockfish.lines[0][0]);
	status.stockfish.running = 0;
}

export const Stockfish = {
	async download() {
		gtag("event", "fen_stockfish_download");
		status.stockfish.status = 1;
		for(const file of files) await fetch(file);
		for(const file of files) await fetch(file);
		// await new Promise(resolve => {
		// 	async function waitStockfish() {
		// 		if(await checkStockfishModel()) resolve();
		// 		else setTimeout(waitStockfish, 50);
		// 	}
		// 	waitStockfish();
		// });
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
};
