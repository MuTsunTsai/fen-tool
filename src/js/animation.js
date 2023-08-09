import { getAsset } from "./asset";
import { drawBoard, drawPiece } from "./draw";
import { dpr } from "./meta/env";
import { parseFEN, parseSquare, parseXY } from "./meta/fen.mjs";
import { getDimensions } from "./meta/option";

const speed = 150;

/** For injecting dependencies. */
export const animeSettings = {};

/** @type {Animation} */
let animation;

export function animate(before, after, instruction, reverse) {
	stopAnimation();
	animation = new Animation(before, after, instruction, reverse);
	return animation.promise;
}

export function stopAnimation(useCallBack) {
	if(animation) animation.stop(useCallBack ? animeSettings.callback : undefined);
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
		const { h, w } = animeSettings.options;
		console.log(h);
		for(const stage of stages) {
			const moves = [];
			const squares = stage.match(/[`a-z]\d(=(\*\d)?[A-Z])?/g);
			for(let i = 0; i < squares.length; i += 2) {
				let from = squares[i], to = squares[i + 1];
				const sq = parseSquare(from, w, h);
				const move = {
					p: board[sq],
					promo: to.match(/=(.+)$/)?.[1],
					from: parseXY(from, h),
					to: parseXY(to, h),
				};
				board[sq] = "";
				moves.push(move);
			}
			this.stages.push({
				board: board.concat(),
				moves,
			});
			for(const move of moves) {
				board[move.to.y * w + move.to.x] = move.promo || move.p;
			}
		}

		this.background = undefined;
		this.anime = this.step.bind(this);
		this.request = requestAnimationFrame(this.anime);
	}

	stop(callback) {
		cancelAnimationFrame(this.request);
		animation = undefined;
		if(callback) callback(this.after);
		this.resolve();
	}

	step(timestamp) {
		const { ctx, options, callback } = animeSettings;

		if(!this.startTime) this.startTime = timestamp
		const delta = (timestamp - this.startTime) / speed;
		const cursor = Math.floor(delta);

		if(cursor >= this.stages.length) return this.stop(callback);

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
		const dim = getDimensions(options);
		ctx.save();
		ctx.translate(dim.offset.x, dim.offset.y);
		const assets = getAsset(options, dpr);
		let offset = delta - Math.floor(delta);
		if(this.reverse) offset = 1 - offset;
		for(const move of this.stages[stageIndex].moves) {
			const x = move.from.x * (1 - offset) + move.to.x * offset;
			const y = move.from.y * (1 - offset) + move.to.y * offset;
			drawPiece(ctx, assets, y, x, move.p, options, dpr);
		}
		ctx.restore();

		this.request = requestAnimationFrame(this.anime);
	}
}