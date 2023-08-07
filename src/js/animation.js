import { getAsset } from "./asset";
import { drawBoard, drawPiece } from "./draw";
import { dpr } from "./layout";
import { parseFEN, parseSquare, parseXY } from "./meta/fen.mjs";
import { ctx } from "./render";
import { setFEN } from "./squares";
import { store } from "./store";

const speed = 150;

/** @type {Animation} */
let animation;

export function animate(before, after, instruction, reverse) {
	if(animation) animation.stop();
	animation = new Animation(before, after, instruction, reverse);
	return animation.promise;
}

class Animation {

	constructor(before, after, instruction, reverse) {
		this.after = reverse ? before : after;
		this.reverse = reverse;

		/** @type {Promise<void>} */
		this.promise = new Promise(resolve => this.resolve = resolve);

		this.cursor = -1;
		this.stages = [];
		const stages = instruction.split(",");
		const board = parseFEN(before);
		const h = store.board.h;
		for(const stage of stages) {
			const moves = [];
			const squares = stage.match(/[a-z]\d/g);
			for(let i = 0; i < squares.length; i += 2) {
				let from = squares[i], to = squares[i + 1];
				const sq = parseSquare(from);
				const move = {
					p: board[sq],
					from: parseXY(from),
					to: parseXY(to),
				};
				board[sq] = "";
				moves.push(move);
			}
			this.stages.push({
				board: board.concat(),
				moves,
			});
			for(const move of moves) {
				board[move.to.y * h + move.to.x] = move.p;
			}
		}

		this.background = undefined;
		this.callback = this.step.bind(this);
		this.request = requestAnimationFrame(this.callback);
	}

	stop() {
		cancelAnimationFrame(this.request);
		animation = undefined;
		this.resolve();
	}

	step(timestamp) {
		if(!this.startTime) this.startTime = timestamp
		const options = store.board;
		const delta = (timestamp - this.startTime) / speed;
		const cursor = Math.floor(delta);

		if(cursor >= this.stages.length) {
			setFEN(this.after);
			this.stop();
			return;
		}

		// Draw background
		const stageIndex = this.reverse ? this.stages.length - 1 - cursor : cursor;
		if(cursor > this.cursor) {
			this.cursor = cursor;
			drawBoard(ctx, this.stages[stageIndex].board, options, dpr);
			this.background = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		} else {
			ctx.putImageData(this.background, 0, 0);
		}

		// Draw moving pieces
		const assets = getAsset(options, dpr);
		let offset = delta - Math.floor(delta);
		if(this.reverse) offset = 1 - offset;
		for(const move of this.stages[stageIndex].moves) {
			const x = move.from.x * (1 - offset) + move.to.x * offset;
			const y = move.from.y * (1 - offset) + move.to.y * offset;
			drawPiece(ctx, assets, y, x, move.p, options, dpr);
		}
		this.request = requestAnimationFrame(this.callback);
	}
}