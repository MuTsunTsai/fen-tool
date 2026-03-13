import { parseFEN } from "app/meta/fen";
import { dpr } from "app/meta/dpr";
import { getDimensions, makeOption } from "app/meta/option";
import { drawBoard } from "app/view/draw";
import { animate, animeSettings, stopAnimation } from "app/view/animation";
import { hasAsset, setAsset } from "app/view/asset";

import STYLES from "./popeye-board.css?raw";

import type { BoardOptions } from "app/meta/option";

/** Request asset image via iframe postMessage. */
export async function requestAsset(
	iframe: HTMLIFrameElement, set: string, size: number
): Promise<void> {
	if(hasAsset(set, size, dpr)) return;
	const channel = new MessageChannel();
	const promise = new Promise<void>(resolve => {
		channel.port1.onmessage = async event => {
			const img = await loadImg(event.data);
			setAsset(set, size, dpr, img);
			resolve();
		};
	});
	iframe.contentWindow!.postMessage(
		{ type: "asset", options: { set, size } },
		"*",
		[channel.port2]
	);
	await promise;
}

function loadImg(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = e => reject(e);
		img.src = src;
	});
}

// SVG icons for navigation buttons (chevron-based)
const SVG_FIRST = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 3v10h1.5V3H4z"/><path d="M12 3L6.5 8l5.5 5V3z"/></svg>`;
const SVG_PREV = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M11 3L5.5 8l5.5 5V3z"/></svg>`;
const SVG_NEXT = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3l5.5 5L5 13V3z"/></svg>`;
const SVG_LAST = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 3v10H12V3h-1.5z"/><path d="M4 3l5.5 5L4 13V3z"/></svg>`;


export type NavigateAction = "first" | "prev" | "next" | "last";

export class PopeyeBoardElement extends HTMLElement {

	private canvas!: HTMLCanvasElement;
	private ctx!: CanvasRenderingContext2D;
	private shadow!: ShadowRoot;
	private errorEl!: HTMLDivElement;
	private options!: BoardOptions;
	private ready: boolean = false;
	private currentFEN: string = "";
	private navigateCallback: ((action: NavigateAction) => void) | null = null;

	// Injected by the entry module
	static iframe: HTMLIFrameElement;
	static defaults: DOMStringMap = {};

	connectedCallback(): void {
		this.shadow = this.attachShadow({ mode: "open" });

		const style = document.createElement("style");
		style.textContent = STYLES;
		this.shadow.appendChild(style);

		this.canvas = document.createElement("canvas");
		this.canvas.style.display = "block";
		this.shadow.appendChild(this.canvas);

		this.buildNavBar();

		this.errorEl = document.createElement("div");
		this.errorEl.style.cssText = "color:red;font-size:14px;padding:8px;display:none;";
		this.shadow.appendChild(this.errorEl);

		this.ctx = this.canvas.getContext("2d", { willReadFrequently: true })!;

		this.initOptions();
		this.loadAssetAndDraw();
	}

	private buildNavBar(): void {
		const nav = document.createElement("div");
		nav.className = "nav";
		const actions: [string, NavigateAction][] = [
			[SVG_FIRST, "first"],
			[SVG_PREV, "prev"],
			[SVG_NEXT, "next"],
			[SVG_LAST, "last"],
		];
		for(const [icon, action] of actions) {
			const btn = document.createElement("button");
			btn.innerHTML = icon;
			btn.addEventListener("click", () => this.navigateCallback?.(action));
			nav.appendChild(btn);
		}
		this.shadow.appendChild(nav);
	}

	/** Register a callback for navigation button clicks. */
	onNavigate(callback: (action: NavigateAction) => void): void {
		this.navigateCallback = callback;
	}

	private initOptions(): void {
		const d = PopeyeBoardElement.defaults;
		this.options = makeOption({
			size: Number(this.dataset.size || d.size) || undefined,
			set: this.dataset.set || d.set,
			bg: (this.dataset.bg || d.bg) as BoardOptions["bg"],
			pattern: this.dataset.pattern || d.pattern,
			border: this.dataset.border || d.border,
			blackWhite: Boolean(this.dataset.blackWhite ?? d.blackWhite),
			coordinates: Boolean(this.dataset.coordinates ?? d.coordinates),
			SN: Boolean(this.dataset.sn ?? d.sn),
		});
	}

	private async loadAssetAndDraw(): Promise<void> {
		try {
			await requestAsset(
				PopeyeBoardElement.iframe,
				this.options.set, this.options.size
			);
			this.ready = true;
			// If a FEN was already set before asset loaded, draw it now
			if(this.currentFEN) this.drawFEN(this.currentFEN);
		} catch {
			this.showError("Failed to load chess piece assets.");
		}
	}

	showError(msg: string): void {
		this.errorEl.textContent = msg;
		this.errorEl.style.display = "block";
		this.canvas.style.display = "none";
	}

	clearError(): void {
		this.errorEl.style.display = "none";
		this.canvas.style.display = "block";
	}

	/** Apply this board's state to the shared animeSettings. */
	private applyAnimeSettings(): void {
		animeSettings.ctx = this.ctx;
		animeSettings.options = this.options;
		animeSettings.callback = fen => this.drawFEN(fen);
	}

	/** Draw the board for the given FEN. */
	drawFEN(fen: string): void {
		this.currentFEN = fen;
		if(!this.ready) return;
		this.clearError();
		const squares = parseFEN(fen, this.options.w, this.options.h);
		const { w, h } = getDimensions(this.options);
		this.canvas.width = w * dpr;
		this.canvas.height = h * dpr;
		this.canvas.style.width = w + "px";
		this.canvas.style.height = h + "px";
		drawBoard(this.ctx, squares, this.options, dpr);
	}

	/** Stop the current animation. */
	stop(): void {
		this.applyAnimeSettings();
		stopAnimation(true);
	}

	/** Play a move animation. */
	doAnimate(before: string, after: string, instruction: string, reverse: boolean = false): Promise<void> {
		if(!this.ready) {
			this.drawFEN(reverse ? before : after);
			return Promise.resolve();
		}
		this.applyAnimeSettings();
		return animate(before, after, instruction, reverse);
	}
}
