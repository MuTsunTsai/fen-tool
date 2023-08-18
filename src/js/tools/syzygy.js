import { orthodoxFEN } from "../squares";
import { state, status } from "../store";
import { importGame, loadChessModule } from "./play";

if(state.syzygy.lines) {
	const lines = state.syzygy.lines;
	lines.forEach(l => l.searching = false);
	state.syzygy.lines = [];
	loadChessModule().then(m => {
		module = m;
		state.syzygy.lines = lines;
	});
}

/** @type {import("../modules/chess.mjs")} */
let module;

let context;

function sleep(s) {
	return new Promise(resolve => setTimeout(resolve, s * 1000));
}

async function api(fen, ctx) {
	try {
		if(!ctx.running) return null;
		const ready = ctx.ready;
		ctx.ready = ready.then(() => sleep(1)); // Restrict to 1 request per second
		await ready;
		if(!ctx.running) return null;
		const response = await fetch("http://tablebase.lichess.ovh/standard?fen=" + fen);
		if(response.status == 429) {
			// Too many requests. Wait for one minute.
			await sleep(61);
			return await api(fen, ctx);
		} else return await response.json();
	} catch {
		throw "Unable to connect to the server. Please check your network connection.";
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

	ctx.op = opposite(outcome);
	const moves = json.moves.filter(m => m.category == ctx.op);
	for(const ply of moves) {
		chess.init(ctx.fen);
		const [from, to, promotion] = ply.uci.match(/..|./g);
		chess.move({ from, to, promotion });
		const line = {
			fen: chess.fen(),
			dtm: ply.dtm,
			moves: chess.state.history.concat(),
			pgn: chess.copyPGN(),
			searching: false,
		};
		state.syzygy.lines.push(line);
	}
	if(!ctx.running) return;

	let lines = state.syzygy.lines.concat();
	if(lines.length > 1) return;

	const line = lines[0];
	line.searching = true;
	line.moves[0].annotation = "!";
	while(lines.length) {
		const tasks = lines.map(l => search(l, ctx));
		await Promise.all(tasks);
		lines = state.syzygy.lines.filter(l => l.searching);
		if(!ctx.running) return;
	}
}

async function search(line, ctx) {
	const chess = new module.Chess();
	chess.init(line.fen);
	const hasDtm = typeof line.dtm == "number";
	const moves = chess.moves({ verbose: true });
	const tasks = moves.map(move => api(move.after, ctx).then(json => {
		if(!ctx.running) return null;
		const moves = json.moves.filter(m => m.category == ctx.op);
		return {
			score: (hasDtm ? json.dtm : 0) - moves.length,
			json,
			dtm: json.dtm,
			defense: move,
			moves,
		};
	}));
	const history = line.moves;

	let results = (await Promise.all(tasks))
		.filter(r => r)
		.sort((a, b) => b.score - a.score)
		.filter((r, _, a) => r.score == a[0].score);
	line.searching = false;
	if(!ctx.running) return;

	let defense;
	const continuations = results
		.filter(r => hasDtm && r.moves.length > 0 || r.moves.length == 1)
		.map(r => {
			chess.init(line.fen);
			defense = chess.move(r.defense);
			const [from, to, promotion] = r.moves[0].uci.match(/..|./g);
			const move = chess.move({ from, to, promotion });
			if(r.moves.length == 1) move.annotation = "!";
			return {
				dtm: typeof r.dtm == "number" ? 1 - r.dtm : null,
				fen: chess.fen(),
				moves: history.concat(chess.state.history),
				pgn: chess.copyPGN(history),
				searching: true,
			};
		});
	if(continuations.length == 0) return;
	if(continuations.length == 1) defense.annotation = "!";
	const lines = state.syzygy.lines.concat();
	const index = lines.indexOf(line);
	// console.log(lines, line, index, continuations);
	lines.splice(index, 1, ...continuations);
	state.syzygy.lines = lines;
}

const WIN = ["win", "maybe-win", "cursed-win"]
const LOSS = ["loss", "maybe-loss", "blessed-loss"];

function opposite(outcome) {
	if(outcome == "draw") return outcome;
	return LOSS[WIN.indexOf(outcome)];
}

export const Syzygy = {
	async run() {
		try {
			gtag("event", "fen_syzygy_run");
			status.syzygy.running = true;
			state.syzygy.header = null;
			state.syzygy.lines = null;
			const fen = orthodoxFEN();
			if(!fen) throw "Only orthodox chess is supported.";
			const count = fen.split(" ")[0].match(/[a-z]/ig)?.length;
			if(count > 7) throw "Only supports position with up to 7 pieces.";

			context = {
				fen,
				running: true,
				ready: Promise.resolve(),
			};
			await run(context);
		} catch(e) {
			alert(e instanceof Error ? e.message : e);
		} finally {
			status.syzygy.running = false;
		}
	},
	play(line) {
		gtag("event", "fen_syzygy_play");
		state.play.mode = "normal";
		state.tab = 6;
		console.log(line.pgn);
		importGame(line.pgn);
	},
	stop() {
		if(context) context.running = false;
		state.syzygy.lines?.forEach(l => l.searching = false);
		status.syzygy.running = false;
	},
	format(line) {
		return module.formatGame(line.moves) + (line.searching ? " ..." : "");
	},
};
