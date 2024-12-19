import { ONE_SECOND } from "app/meta/constants";
import { orthodoxFEN } from "app/interface/squares";
import { onSession, state, status } from "app/store";
import { importGame, loadChessModule } from "./play/play";
import { alert } from "app/meta/dialogs";

const TOO_MANY_REQUESTS = 429;
const COOL_DOWN_TIME = 61;
const MAX_PIECES = 7;

onSession(() => {
	if(state.syzygy.lines) {
		const lines = state.syzygy.lines;
		lines.forEach(l => l.searching = false);
		state.syzygy.lines = [];
		loadChessModule().then(m => {
			module = m;
			state.syzygy.lines = lines;
		});
	}
});

/** @type {import("app/modules/chess/chess")} */
let module;

let context;

const sleeping = new Set();

function sleep(s) {
	return new Promise(resolve => {
		sleeping.add(resolve);
		setTimeout(() => {
			sleeping.delete(resolve);
			resolve();
		}, s * ONE_SECOND);
	});
}

async function api(fen, ctx) {
	try {
		if(!ctx.running) return null;
		const ready = ctx.ready;
		ctx.ready = ready.then(() => sleep(1)); // Restrict to 1 request per second
		await ready;
		if(!ctx.running) return null;
		const response = await fetch("https://tablebase.lichess.ovh/standard?fen=" + fen);
		if(response.status == TOO_MANY_REQUESTS) {
			// Too many requests. Wait for one minute.
			await sleep(COOL_DOWN_TIME);
			return await api(fen, ctx);
		} else { return await response.json(); }
	} catch {
		throw new Error("Unable to connect to the server. Please check your network connection.");
	}
}

async function run(ctx) {
	module = await loadChessModule();
	const chess = new module.Chess();
	chess.init(ctx.fen);

	// Initialize
	const json = await api(chess.fen(), ctx);
	const side = chess.turn() == "w" ? "White" : "Black";
	const outcome = json.category;
	state.syzygy.header = `The position is a ${outcome} for ${side}.`;
	if(outcome == "unknown" || outcome.includes("loss") || !ctx.running) return;
	state.syzygy.lines = [];

	ctx.outcome = outcome;
	ctx.op = opposite(outcome);
	const moves = json.moves.filter(m => m.category == ctx.op);
	for(const ply of moves) {
		chess.init(ctx.fen);
		const [from, to, promotion] = ply.uci.match(/..|./g);
		chess.move({ from, to, promotion });
		const fen = chess.fen();
		ctx.positions.add(toPosition(fen));
		const line = {
			fen,
			dtm: ply.dtm,
			indent: 0,
			history: chess.state.history.concat(),
			leaf: true,
			moves: chess.state.history.concat(),
			pgn: chess.copyPGN(),
			transpose: false,
			searching: !chess.isGameOver(),
		};
		state.syzygy.lines.push(line);
	}
	if(!ctx.running) return;

	let lines = state.syzygy.lines.filter(l => l.searching);
	if(lines.length > 1) return;

	const line = lines[0];
	line.moves[0].annotation = "!";
	while(lines.length) {
		const tasks = lines.map(l => search(l, ctx));
		// eslint-disable-next-line no-await-in-loop
		await Promise.all(tasks);
		lines = state.syzygy.lines.filter(l => l.searching);
		if(!ctx.running) return;
	}
}

function toPosition(fen) {
	return fen.replace(/ \d+ \d+$/, "");
}

async function search(line, ctx) {
	const chess = new module.Chess();
	chess.init(line.fen);
	const hasDtm = typeof line.dtm == "number";
	const moves = chess.moves({ verbose: true });
	const json = await api(line.fen, ctx);
	const defenses = new Set(json.moves.filter(m => m.category == ctx.outcome).map(m => m.uci));
	const tasks = moves
		.filter(m => defenses.has(m.from + m.to + (m.promotion || "")))
		.map(m => queryDefense(m, ctx, hasDtm));

	const results = (await Promise.all(tasks))
		.filter(r => r)
		.sort((a, b) => b.score - a.score)
		.filter((r, _, a) => r.score == a[0].score);
	if(line.searching) line.searching = false;
	if(!ctx.running) return;

	const continuations = results.filter(r => ctx.op != "draw" && r.moves.length > 0 || r.moves.length == 1);
	if(continuations.length == 0) return;
	const unique = continuations.length == 1;
	const branches = continuations.map(r => createBranch(r, line, unique, chess, ctx));
	const lines = state.syzygy.lines.concat();
	const index = lines.indexOf(line);
	if(unique) { lines.splice(index, 1, ...branches); } else {
		line.leaf = false;
		lines.splice(index + 1, 0, ...branches);
	}
	state.syzygy.lines = lines;
}

async function queryDefense(move, ctx, hasDtm) {
	const json = await api(move.after, ctx);
	if(!ctx.running) return null;
	const moves = json.moves.filter(m => m.category == ctx.op);
	return {
		score: (hasDtm ? json.dtm : 0) - moves.length,
		json,
		dtm: json.dtm,
		defense: move,
		moves,
	};
}

function createBranch(r, line, unique, chess, ctx) {
	chess.init(line.fen);
	const defense = chess.move(r.defense);
	if(unique) defense.annotation = "!";
	const [from, to, promotion] = r.moves[0].uci.match(/..|./g);
	const move = chess.move({ from, to, promotion });
	if(r.moves.length == 1) move.annotation = "!";
	const fen = chess.fen();
	const pos = toPosition(fen);
	const transpose = ctx.positions.has(pos);
	if(!transpose) ctx.positions.add(pos);
	const selfHistory = chess.state.history.concat();
	return {
		dtm: typeof r.dtm == "number" ? 1 - r.dtm : null,
		fen,
		transpose,
		leaf: true,
		indent: line.indent + (unique ? 0 : 1),
		history: line.history.concat(selfHistory),
		moves: unique ? line.moves.concat(selfHistory) : selfHistory,
		pgn: chess.copyPGN(line.history),
		searching: !chess.isGameOver() && !transpose,
	};
}

const WIN = ["win", "maybe-win", "cursed-win"];
const LOSS = ["loss", "maybe-loss", "blessed-loss"];

function opposite(outcome) {
	if(outcome == "draw") return outcome;
	return LOSS[WIN.indexOf(outcome)];
}

export const Syzygy = {
	async run() {
		const ctx = {
			positions: new Set(),
			running: true,
			ready: Promise.resolve(),
		};
		context = ctx;
		try {
			gtag("event", "fen_syzygy_run");
			status.syzygy.running = true;
			state.syzygy.header = null;
			state.syzygy.lines = null;
			ctx.fen = orthodoxFEN();
			if(!ctx.fen) throw new Error("Only orthodox chess is supported.");
			const count = ctx.fen.split(" ")[0].match(/[a-z]/ig)?.length;
			if(count > MAX_PIECES) {
				throw new Error(`Only supports position with up to ${MAX_PIECES} pieces.`);
			}
			await run(ctx);
		} catch(e) {
			alert(e instanceof Error ? e.message : e);
		} finally {
			if(ctx.running) Syzygy.stop();
		}
	},
	play(line) {
		gtag("event", "fen_syzygy_play");
		state.play.mode = "normal";
		state.tab = 6;
		importGame(line.pgn);
	},
	stop() {
		if(context) context.running = false;
		for(const res of sleeping) res();
		sleeping.clear();
		state.syzygy.lines?.forEach(l => l.searching = false);
		status.syzygy.running = false;
	},
	format(line) {
		let result = module.formatGame(line.moves);
		if(line.searching) result += " ...";
		else if(line.transpose) result += " (transpose)";
		return result;
	},
};
