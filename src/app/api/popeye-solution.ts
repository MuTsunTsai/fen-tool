import { formatSolution } from "app/meta/popeye/popeye";
import { pieceMap } from "app/meta/popeye/base";
import { parsePieceCommand } from "app/meta/popeye/piece";
import STYLES from "./popeye-solution.css?raw";

import type { NavigateAction, PopeyeBoardElement } from "./popeye-board";

/** Remove common leading indentation from text content, then trim. */
function dedent(text: string): string {
	const lines = text.split("\n");
	// Skip empty first line (newline right after opening tag)
	if(lines.length > 0 && lines[0].trim() === "") lines.shift();
	if(lines.length === 0) return "";

	// Find the indentation of the first line
	const firstIndent = lines[0].match(/^(\s*)/)?.[1] || "";
	if(firstIndent.length === 0) return lines.join("\n").trim();

	// Check if every non-empty line has at least this indentation
	const allIndented = lines.every(l => l.trim() === "" || l.startsWith(firstIndent));
	if(!allIndented) return lines.join("\n").trim();

	// Strip the common indentation
	return lines.map(l => l.trim() === "" ? "" : l.slice(firstIndent.length)).join("\n").trim();
}

/** Extract the initial FEN from the Popeye input. */
function getInitFEN(input: string): string {
	// Try forsyth command first
	const forsythMatch = input.match(/fors(?:y(?:t(?:h)?)?)?\s+(\S+)/i);
	if(forsythMatch) return forsythMatch[1];

	// Try pieces command (e.g. "pieces white ke1 qd1")
	const piecesFEN = parsePieceCommand(input);
	if(piecesFEN) return piecesFEN;

	return "";
}

export class PopeyeSolutionElement extends HTMLElement {

	private shadow!: ShadowRoot;
	private contentEl!: HTMLDivElement;
	private errorEl!: HTMLDivElement;
	private steps: HTMLSpanElement[] = [];
	private index: number = 0;
	private board: PopeyeBoardElement | null = null;

	connectedCallback(): void {
		this.shadow = this.attachShadow({ mode: "open" });

		const style = document.createElement("style");
		style.textContent = STYLES;
		this.shadow.appendChild(style);

		this.contentEl = document.createElement("div");
		this.contentEl.className = "content";
		this.shadow.appendChild(this.contentEl);

		this.errorEl = document.createElement("div");
		this.errorEl.className = "error";
		this.errorEl.style.display = "none";
		this.shadow.appendChild(this.errorEl);

		this.resolveBoard();
		this.parseSolution();
		this.setupKeyboard();
	}

	disconnectedCallback(): void {
		this.removeEventListener("keydown", this.onKeydown);
	}

	/** Find the linked <popeye-board> element via the `for` attribute. */
	private resolveBoard(): void {
		const forId = this.getAttribute("for");
		if(!forId) {
			this.showError("Missing 'for' attribute.");
			return;
		}
		const el = document.getElementById(forId);
		if(!el || el.tagName.toLowerCase() !== "popeye-board") {
			this.showError(`Cannot find <popeye-board id="${forId}">.`);
			return;
		}
		this.board = el as unknown as PopeyeBoardElement;
		this.board.clearError();
		this.board.onNavigate(action => this.handleNavigate(action));
	}

	private handleNavigate(action: NavigateAction): void {
		if(this.steps.length === 0) return;
		switch(action) {
			case "first": this.goTo(0); break;
			case "prev": this.moveBy(-1); break;
			case "next": this.moveBy(1); break;
			case "last": this.goTo(this.steps.length - 1); break;
			default: break;
		}
	}

	/** Parse the pieceMap attribute and inject it before calling formatSolution. */
	private parsePieceMap(): Record<string, string> {
		const attr = this.dataset.pieceMap;
		if(!attr) return {};
		const map: Record<string, string> = {};
		// Support both comma-separated and whitespace-separated KEY=VALUE pairs
		const pairs = attr.split(/[,\s]+/);
		for(const pair of pairs) {
			const [key, value] = pair.toUpperCase().split("=");
			if(key && value) map[key] = value;
		}
		return map;
	}

	/** Read templates, call formatSolution, and render the result. */
	private parseSolution(): void {
		const inputScript = this.querySelector("script[type='text/plain'][data-input]");
		const outputScript = this.querySelector("script[type='text/plain'][data-output]");

		if(!inputScript || !outputScript) {
			this.showError("Missing <script type=\"text/plain\" data-input> or <script type=\"text/plain\" data-output>.");
			return;
		}

		const input = dedent(inputScript.textContent || "");
		const output = dedent(outputScript.textContent || "");

		if(!input || !output) {
			this.showError("Empty input or output content.");
			return;
		}

		const initFEN = getInitFEN(input);
		if(!initFEN) {
			this.board?.showError("Cannot determine initial position from input.");
			this.showError("Cannot determine initial position from input.");
			return;
		}

		// Inject custom pieceMap before formatting
		const customMap = this.parsePieceMap();
		const originalCustom = pieceMap.custom;
		pieceMap.custom = () => customMap;

		try {
			const html = formatSolution(input, initFEN, output);
			this.contentEl.innerHTML = html;
		} finally {
			pieceMap.custom = originalCustom;
		}

		this.setupSteps();
	}

	/** Collect step spans and wire up click handlers. */
	private setupSteps(): void {
		this.steps = [...this.contentEl.querySelectorAll<HTMLSpanElement>(".step")];
		if(this.steps.length === 0) return;

		this.contentEl.addEventListener("click", e => {
			const target = (e.target as HTMLElement).closest(".step") as HTMLSpanElement | null;
			if(!target) return;
			const idx = this.steps.indexOf(target);
			if(idx >= 0 && idx !== this.index) {
				this.goTo(idx);
			}
		});

		// Initialize to the first step
		this.goTo(0, true);
	}

	/** Navigate to a specific step by index. */
	private async goTo(index: number, init?: boolean): Promise<void> {
		const newStep = this.steps[index];
		const oldStep = this.steps[this.index];

		if(this.board) {
			// Check if we can do a reverse animation (going backward one step)
			if(
				oldStep?.dataset.anime &&
				(
					index === this.index - 1 && !oldStep.dataset.before ||
					newStep.dataset.fen === oldStep.dataset.before
				)
			) {
				await this.board.doAnimate(
					newStep.dataset.fen!, oldStep.dataset.fen!, oldStep.dataset.anime, true
				);
			} else {
				const before = newStep.dataset.before || this.steps[index - 1]?.dataset.fen;
				if(newStep.dataset.anime && before) {
					await this.board.doAnimate(before, newStep.dataset.fen!, newStep.dataset.anime);
				} else {
					this.board.stop();
					this.board.drawFEN(newStep.dataset.fen!);
				}
			}
		}

		if(!init && oldStep) oldStep.classList.remove("active");
		this.index = index;
		newStep.classList.add("active");

		// Scroll the active step into view within the solution container
		requestAnimationFrame(() => newStep.scrollIntoView({ block: "nearest" }));
	}

	/** Set up keyboard navigation on this element. */
	private setupKeyboard(): void {
		// Make the element focusable
		if(!this.hasAttribute("tabindex")) {
			this.setAttribute("tabindex", "0");
		}
		this.addEventListener("keydown", this.onKeydown);
	}

	private onKeydown = (e: KeyboardEvent): void => {
		if(this.steps.length === 0) return;
		if(e.key === "ArrowLeft" || e.key === "ArrowUp") {
			e.preventDefault();
			this.moveBy(-1);
		} else if(e.key === "ArrowRight" || e.key === "ArrowDown") {
			e.preventDefault();
			this.moveBy(1);
		} else if(e.key === "Home") {
			e.preventDefault();
			this.goTo(0);
		} else if(e.key === "End") {
			e.preventDefault();
			this.goTo(this.steps.length - 1);
		}
	};

	/** Move by a relative offset, clamped to valid range. */
	private moveBy(delta: number): void {
		let n = this.index + delta;
		if(n < 0) n = 0;
		if(n > this.steps.length - 1) n = this.steps.length - 1;
		if(n !== this.index) this.goTo(n);
	}

	private showError(msg: string): void {
		this.errorEl.textContent = msg;
		this.errorEl.style.display = "block";
		this.contentEl.style.display = "none";
	}
}
