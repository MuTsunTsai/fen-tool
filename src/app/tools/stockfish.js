import { clone } from "app/meta/clone";
import { env } from "app/meta/env";
import { SQ } from "app/meta/popeye/base";
import { orthodoxFEN } from "app/interface/squares";
import { STOCKFISH, onSession, state, status, store } from "app/store";
import { importGame, loadChessModule } from "./play/play";
import { alert } from "app/meta/dialogs";
import { StockfishRunning, StockfishStatus } from "app/meta/enum";

/**
 * Minimal amount of memory required to run Stockfish.
 */
const MIN_MEMORY = 4;

const DEPTH_THRESHOLD = 4;
const PERCENTAGE = 100;
const HTTP_SUCCESS = 200;
const INFO_OFFSET = 5;
const CONCURRENCY_SAVING = 4;
const DRAW_THRESHOLD = 1;

onSession(() => {
	if(state.stockfish.lines.length) {
		const lines = state.stockfish.lines;
		const header = state.stockfish.header;
		state.stockfish.lines = [];
		state.stockfish.header = [];
		loadChessModule().then(m => {
			module = m;
			state.stockfish.lines = lines;
			state.stockfish.header = header;
		});
	}
});

/** @type {Worker} */
let stockfish;

/** @type {import("app/modules/chess/chess")} */
let module;

/** @type {import("app/modules/chess/chess").Chess} */
let chess;

/** @type {string} */
let fen;

function cmd(text) {
	stockfish.postMessage(text);
}
window.cmd = cmd; // For dev purpose

const regMove = `(${SQ})(${SQ})([qrbn]?)`;

const path = "modules/stockfish/";
const suffix = env.thread ? "" : "-single";

// We can't really tell if SharedArrayBuffer is enabled on first launch,
// so we download all files anyway.
const files = [
	`${path}stockfish-nnue-16.js#stockfish-nnue-16.wasm,worker`,
	`${path}stockfish-nnue-16.wasm`,
	`${path}stockfish-nnue-16-single.js#stockfish-nnue-16-single.wasm,worker`,
	`${path}stockfish-nnue-16-single.wasm`,
	`${path}nn-5af11540bbfe.nnue`,
];

function init(memory) {
	if(stockfish) return Promise.resolve();
	return new Promise((resolve, reject) => {
		status.stockfish.running = StockfishRunning.starting;
		stockfish = new Worker(`${path}stockfish-nnue-16${suffix}.js#stockfish-nnue-16${suffix}.wasm`);
		stockfish.onmessage = e => {
			const msg = e.data;
			console.info(msg);
			if(msg == "readyok") {
				status.stockfish.running = StockfishRunning.running;
				resolve();
			}
			if(msg.startsWith("info ")) parseInfo(msg.substring(INFO_OFFSET));
			if(msg.match(new RegExp(`^bestmove ${regMove}`))) findBest();
		};
		stockfish.onerror = e => {
			if(e.message.includes("RangeError")) reject(-1);
			else if(e.message.includes("memory")) reject("Not enough memory.");
			else reject("Unknown error has occurred.");
		};

		cmd("uci");
		cmd("setoption name Use NNUE value true");
		if(env.thread) {
			cmd("setoption name Threads value " + Math.max(2, navigator.hardwareConcurrency - CONCURRENCY_SAVING));
		}
		cmd("setoption name Hash value " + memory);
		cmd("isready");
	});
}

function parseInfo(info) {
	if(status.stockfish.running != StockfishRunning.running) return; // Prevent displaying weird results.

	const multi = info.match(/multipv (\d+)/);
	if(!multi) return;
	const index = Number(multi[1]) - 1;

	const mate = info.match(/mate (-?)(\d+)/);
	const score = info.match(/score cp (-?\d+)/);
	let cp = Number(score && score[1] || 0) / PERCENTAGE;
	let mateNum;

	if(mate) {
		const side = fen.split(" ")[1] == "w" == Boolean(mate[1]) ? "Black" : "White";
		mateNum = Number(mate[2]) + state.stockfish.header.length / 2;
		if(index == 0) state.stockfish.mate = [side, mateNum];
	}
	if(index == 0) {
		const depth = info.match(/depth (\d+)/);
		if(depth) state.stockfish.depth = depth[1];
		if(score) state.stockfish.score = cp;
	}
	const moves = info.match(new RegExp(`pv (${regMove}(?: ${regMove})*)`));
	if(moves) {
		if(state.stockfish.lines[index]?.raw == moves[1]) return;
		const matches = moves[1].split(" ").map(m => m.match(new RegExp(regMove)));
		state.stockfish.moves = [];
		// chess.init(fen);
		// for(const move of state.stockfish.header) {
		// 	const m = chess.move(move);
		// 	m.annotation = move.annotation;
		// }

		const h = state.stockfish.header;
		chess.init(h.length ? h[h.length - 1].after : fen);

		for(const match of matches) {
			const move = chess.move({ from: match[1], to: match[2], promotion: match[3] });
			if(move.san.endsWith("=")) {
				// Stockfish doesn't stop here for some reason
				cp = 0;
				break;
			}
		}
		const line = {
			rawScore: getRawScore(mate, cp),
			score: mate ? mate[1] + "#" + mate[2] : cp.toFixed(2),
			raw: moves[1],
			moves: chess.state.history.concat(),
			pgn: chess.copyPGN(h),
		};
		state.stockfish.lines[index] = line;
	}
	if(store.Stockfish.study) annotate();
}

function getRawScore(mate, cp) {
	if(!mate) return cp;
	return mate[1] ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
}

function annotate() {
	const lines = state.stockfish.lines.filter(l => l && l.moves.length);
	if(lines.length <= 1) return false;
	lines.forEach(l => l.moves[0] && (l.moves[0].annotation = undefined));
	const win = lines.filter(l => l.rawScore > DRAW_THRESHOLD);
	if(win.length > 1) return false;
	if(win.length == 1) {
		win[0].moves[0].annotation = "!";
		return true;
	}
	const draw = lines.filter(l => l.rawScore > -DRAW_THRESHOLD);
	if(draw.length == 1) {
		draw[0].moves[0].annotation = "!";
		return true;
	}
	return false;
}

function findBest() {
	const depth = store.Stockfish.depth;
	if(!store.Stockfish.study || depth < DEPTH_THRESHOLD || !annotate()) {
		Stockfish.stop();
	} else {
		const h = state.stockfish.header;
		h.push(...state.stockfish.lines[0].moves.slice(0, 2));
		cmd("position fen " + h[h.length - 1].after);
		cmd("go depth " + depth);
	}
}

async function tryFetch(file) {
	const response = await fetch(file);
	if(response.status != HTTP_SUCCESS) throw new Error();
}

async function tryInitMemory(ready, memory) {
	try {
		await ready;
	} catch(e) {
		if(e !== -1) throw e;
		// Reduce memory and try again
		Stockfish.stop();
		memory /= 2;
		if(memory < MIN_MEMORY) throw new Error("Not enough memory.");
		await tryInitMemory(init(memory), memory);
	}
}

export const Stockfish = {
	async download() {
		gtag("event", "fen_stockfish_download");
		status.stockfish.status = StockfishStatus.downloading;
		if(isHttps && "serviceWorker" in navigator) {
			// First we wait for service worker to finish installing.
			// Otherwise caching won't work.
			await navigator.serviceWorker.ready;
		}
		try {
			await Promise.all(files.map(file => tryFetch(file)));
		} catch {
			alert("Download failed. Please check your network connection.");
			status.stockfish.status = StockfishStatus.notDownloaded;
			return;
		}
		store.Stockfish.downloaded = true;
		status.stockfish.status = StockfishStatus.needReload;
	},
	async analyze() {
		try {
			gtag("event", "fen_stockfish_run");
			const memory = 128; // Default memory
			const ready = init(memory);
			fen = orthodoxFEN();
			if(!fen) throw new Error("Only orthodox chess is supported.");
			if(!module) {
				const m = await loadChessModule();
				if(!module) module = m;
			}
			chess = new module.Chess();
			chess.init(fen);
			await tryInitMemory(ready, memory);

			state.stockfish = clone(STOCKFISH);
			cmd("setoption name MultiPV value " + store.Stockfish.lines);
			cmd("ucinewgame");
			cmd("position fen " + fen);
			cmd("go depth " + store.Stockfish.depth);
		} catch(e) {
			Stockfish.stop();
			alert(e instanceof Error ? e.message : e);
			status.stockfish.running = StockfishRunning.stop;
		}
	},
	play(line) {
		gtag("event", "fen_stockfish_play");
		state.play.mode = "normal";
		state.tab = 6;
		importGame(line.pgn);
	},
	stop() {
		// Stop all Stockfish workers and release memory
		if(stockfish) stockfish.terminate();
		stockfish = undefined;
		status.stockfish.running = StockfishRunning.stop;
	},
	format(moves) {
		return module.formatGame(moves);
	},
};
