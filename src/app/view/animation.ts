import { getAsset } from "./asset";
import { drawBoard } from "./draw";
import { dpr } from "app/meta/env";
import { parseFEN, parseSquare, parseXY } from "app/meta/fen";
import { getDimensions } from "app/meta/option";
import { drawPiece } from "./piece";

import type { BoardOptions } from "app/meta/option";

interface Move {
	p: string;
	promo?: string;
	from: IPoint;
	to: IPoint;
}

interface Stage {
	board: Board;
	moves: Move[];
}

const speed = 150;

/** For injecting dependencies. */
export const animeSettings = {} as {
	ctx: CanvasRenderingContext2D;
	options: BoardOptions;

	/** What to do after the animation is completed. */
	callback: Consumer<string>;
};

let animation: Animation | undefined;

export function animate(before: string, after: string, instruction: string, reverse: boolean = false): Promise<void> {
	stopAnimation();
	animation = new Animation(before, after, instruction, reverse);
	return animation.promise;
}

export function stopAnimation(useCallBack?: boolean): void {
	if(animation) animation.stop(useCallBack ? animeSettings.callback : undefined);
}

class Animation {

	public promise: Promise<void>;
	private after: string;
	private reverse: boolean;
	private resolve!: Action;
	private cursor: number;
	private stages: Stage[];
	private anime: Consumer<DOMHighResTimeStamp>;
	private request: number;
	private background!: ImageData;
	private startTime: number | undefined;

	constructor(before: string, after: string, instruction: string, reverse: boolean) {
		this.after = reverse ? before : after;
		this.reverse = reverse;

		this.promise = new Promise(resolve => this.resolve = resolve);

		this.cursor = -1;
		this.stages = [];
		const stages = instruction.split(",");
		const board = parseFEN(before);
		const { h, w } = animeSettings.options;
		for(const stage of stages) {
			const moves: Move[] = [];
			const squares = stage.match(/[`a-z]\d(=(\*\d)?[A-Z])?/g)!;
			for(let i = 0; i < squares.length; i += 2) {
				const from = squares[i], to = squares[i + 1];
				const sq = parseSquare(from, w, h);
				const move = {
					p: board[sq],
					promo: to.match(/[=](.+)$/)?.[1],
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

		this.anime = this.step.bind(this);
		this.request = requestAnimationFrame(this.anime);
	}

	stop(callback?: Consumer<string>): void {
		cancelAnimationFrame(this.request);
		animation = undefined;
		if(callback) callback(this.after);
		this.resolve();
	}

	step(timestamp: DOMHighResTimeStamp): void {
		const { ctx, options, callback } = animeSettings;

		if(!this.startTime) this.startTime = timestamp;
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
		const info = getDimensions(options);
		ctx.save();
		ctx.translate(info.offset.x, info.offset.y);
		const assets = getAsset(options, dpr);
		let offset = delta - Math.floor(delta);
		if(this.reverse) offset = 1 - offset;
		for(const move of this.stages[stageIndex].moves) {
			const x = move.from.x * (1 - offset) + move.to.x * offset;
			const y = move.from.y * (1 - offset) + move.to.y * offset;
			drawPiece(ctx, y, x, move.p, { info, assets, options, dpr });
		}
		ctx.restore();

		this.request = requestAnimationFrame(this.anime);
	}
}
