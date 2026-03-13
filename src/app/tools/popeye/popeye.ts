import { setFEN, createSnapshot } from "app/interface/squares";
import { onSession, state, store } from "app/store";
import { formatSolution, toNormalFEN } from "app/meta/popeye/popeye";
import { resize } from "app/interface/layout";
import { drawTemplate, load } from "app/view/render";
import { makeForsyth, toSquare } from "app/meta/fen";
import { createAbbrExp, createAbbrReg } from "app/meta/regex";
import { P, defaultCustomMap, toPopeyePiece } from "app/meta/popeye/base";
import { animate, stopAnimation } from "app/view/animation";
import { parsePieceCommand } from "app/meta/popeye/piece";
import { BOARD_SIZE } from "app/meta/constants";
import { DEFAULT_SET, DEFAULT_SIZE } from "app/meta/option";
import { alert } from "app/meta/dialogs";
import { scrollTo, resetScroll, getSteps } from "./output";

interface Bridge {
	initMemory(): void;
	cancel(): void;
	start(): void;
}

/** For DIP */
export const bridge = {} as Bridge;

// Session
onSession(() => {
	state.popeye.running = false; // Do not restore this state
	state.popeye.editMap = false;
	if(state.popeye.playing) {
		load().then(() => requestAnimationFrame(() => setupStepElements(true)));
	}
});

const Commands = ["remark", "2author", "2origin", "3title"];
const COMMANDS = new RegExp(String.raw`(?:${Commands.map(createAbbrExp).join("|")})\s.+$`, "igm");
const PROTOCOL = new RegExp(String.raw`${createAbbrExp("5protocol")}\s+\S+`, "i");
const BEGIN = createAbbrReg("3beginProblem");
const END = createAbbrReg("3endProblem");
const NEXT = /\bnext\s[\s\S]+$/i;
export const FORSYTH = createAbbrExp("3forsyth");
const PIECES = createAbbrExp("2pieces");

function parseInput(text: string): string {
	text = text
		.replace(COMMANDS, "")	// remove remark, author, origin, title
		.replace(PROTOCOL, "")	// remove protocol
		.replace(BEGIN, "") // remove BeginProblem
		.replace(NEXT, "") // accept only one problem input
		.replace(END, ""); // remove EndProblem

	const p = state.popeye;
	const { fen, imitators, fromInput } = getPopeyeFEN(text);
	p.initFEN = fen;
	if(fromInput) {
		setFEN(toNormalFEN(fen));
		return text; // board is assigned manually
	}
	if(imitators.length) text += "\ncond imitator " + imitators.join("");
	return `fors ${fen}\n${text}`;
}

export interface PopeyeBoardInfo {
	fen: string;
	fromInput: boolean;
	imitators: string[];
}

export function getPopeyeFEN(input: string): PopeyeBoardInfo {
	if(new RegExp(`${FORSYTH}|${PIECES}`, "i").test(input)) {
		// If Forsyth command or Pieces command is used, get the board from it
		const fen = parsePieceCommand(input) || input.match(new RegExp(String.raw`${FORSYTH}\s+(\S+)`, "i"))?.[1];
		if(fen) return { fen, imitators: [], fromInput: true };
	}

	const { w, h } = store.board;
	if(w != BOARD_SIZE || h != BOARD_SIZE) throw new Error();

	const imitators: string[] = [];
	const arr = createSnapshot().map((p, i) => {
		if(p == "") return p;
		let f: string | null = store.board.SN ? p.replace("s", "n").replace("S", "N").replace("g", "s").replace("G", "S") : p; // normalize
		f = toPopeyePiece(f);
		if(!f) throw alert("Unspecified fairy piece: " + p);
		if(f.match(/^=?i$/i)) {
			imitators.push(toSquare(i));
			return "";
		}
		return f;
	});
	return { fen: makeForsyth(arr), imitators, fromInput: false };
}

async function setupStepElements(restore?: boolean): Promise<void> {
	const p = state.popeye;
	p.steps = getSteps();
	if(p.steps.length == 0) return;
	goTo(0, true);
	p.playing = true;
	if(restore) await load();
	drawTemplate([]);
	requestAnimationFrame(resize);
}

async function goTo(index: number, init?: boolean): Promise<void> {
	const p = state.popeye;
	const newStep = p.steps[index];
	const oldStep = p.steps[p.index];
	if(
		oldStep && oldStep.dataset.anime &&
		(
			index == p.index - 1 && !oldStep.dataset.before ||
			newStep.dataset.fen == oldStep.dataset.before
		)
	) {
		await animate(newStep.dataset.fen!, oldStep.dataset.fen!, oldStep.dataset.anime, true);
	} else {
		const before = newStep.dataset.before || p.steps[index - 1]?.dataset.fen;
		if(newStep.dataset.anime && before) {
			await animate(before, newStep.dataset.fen!, newStep.dataset.anime);
		} else {
			stopAnimation();
			setFEN(newStep.dataset.fen!);
		}
	}
	if(!init) oldStep.classList.remove("active");
	p.index = index;
	newStep.classList.add("active");

	// This needs to be execute after completing the DOM rendering,
	// as the rendering could change the scroll dimension temporarily
	requestAnimationFrame(() => scrollTo(newStep));
}

export const Popeye = {
	run() {
		gtag("event", "fen_popeye_run");
		bridge.initMemory();
		try {
			const p = state.popeye;
			p.intInput = parseInput(p.input);
			bridge.start();
		} catch {
			// ignore error
		}
	},
	cancel: () => bridge.cancel(),
	play() {
		const p = state.popeye;
		resetScroll();
		gtag("event", "fen_popeye_play");
		p.output = formatSolution(p.intInput, p.initFEN, p.intOutput);
		requestAnimationFrame(() => setupStepElements());
	},
	step(e: Event) {
		const p = state.popeye;
		if(!p.playing) return;
		const index = p.steps.indexOf(e.target as HTMLSpanElement);
		if(index >= 0 && index != p.index) {
			e.preventDefault();
			goTo(index);
		}
	},
	exit() {
		const p = state.popeye;
		setFEN(p.steps[0].dataset.fen!);
		p.output = p.intOutput;
		p.playing = false;
		drawTemplate([]);
		requestAnimationFrame(resize);
	},
	moveBy(v: number) {
		const p = state.popeye;
		let n = p.index;
		n += v;
		if(n < 0) n = 0;
		if(n > p.steps.length - 1) n = p.steps.length - 1;
		Popeye.move(n);
	},
	move(n: number) {
		if(n != state.popeye.index) goTo(n);
	},
	editMap() {
		gtag("event", "fen_popeye_edit_map");
		state.popeye.mapping = getMappingText(store.popeye.pieceMap);
		state.popeye.editMap = true;
	},
	resetMap() {
		state.popeye.mapping = getMappingText(defaultCustomMap);
	},
	saveMap() {
		const lines = state.popeye.mapping.toUpperCase().split("\n");
		const map: Record<string, string> = {};
		for(const line of lines) {
			const [k, v] = line.replace(/\s/g, "").split("=");
			if(k.match(KEY) && v && v.match(VALUE)) map[k] = v;
		}
		store.popeye.pieceMap = map;
		state.popeye.editMap = false;
	},
	copyAPI(): string {
		gtag("event", "fen_popeye_copy_api");
		const p = state.popeye;
		const id = "py-" + Math.random().toString(16).slice(2, 10);

		// Board data- attributes
		const options = store.board;
		let data = "";
		if(options.size != DEFAULT_SIZE) data += ` data-size="${options.size}"`;
		if(options.set != DEFAULT_SET) data += ` data-set="${options.set}"`;
		if(options.bg) data += ` data-bg="${options.bg}"`;
		if(options.pattern) data += ` data-pattern="${options.pattern}"`;
		if(options.border != "1") data += ` data-border="${options.border}"`;
		if(options.blackWhite) data += ` data-black-white`;
		if(options.SN) data += ` data-sn`;

		// Piece map attribute (only if different from default)
		const map = store.popeye.pieceMap;
		let pieceMapAttr = "";
		const isDefault = JSON.stringify(map) === JSON.stringify(defaultCustomMap);
		if(!isDefault) {
			const entries = Object.entries(map);
			if(entries.length) {
				pieceMapAttr = ` data-piece-map="${entries.map(([k, v]) => `${k}=${v}`).join(",")}"`;
			}
		}

		const rawOutput = stripOutput(p.intOutput);

		const board = `<popeye-board id="${id}"${data}></popeye-board>`;
		const solution = [
			`<popeye-solution for="${id}"${pieceMapAttr}>`,
			`  <script type="text/plain" data-input>`,
			p.intInput,
			`  </script>`,
			`  <script type="text/plain" data-output>`,
			rawOutput,
			`  </script>`,
			`</popeye-solution>`,
		].join("\n");

		return `${board}\n${solution}`;
	},
};

/** Convert HTML output to plain text and strip Popeye header/footer. */
function stripOutput(html: string): string {
	const lines = html.replace(/<br>/g, "\n").replace(/<[^>]+>/g, "").split("\n");
	while(lines.length && (lines[0].trim() === "" || /^Popeye WASM/i.test(lines[0]))) {
		lines.shift();
	}
	while(lines.length && (lines[lines.length - 1].trim() === "" || /^solution finished\./i.test(lines[lines.length - 1]))) {
		lines.pop();
	}
	return lines.join("\n");
}

function getMappingText(pieceMap: Record<string, string>): string {
	const map = [];
	for(const key in pieceMap) {
		map.push(`${key}=${pieceMap[key]}`);
	}
	return map.join("\n");
}

const KEY = /^(\*[1-3][KQBNRP]|(\*[1-3])?[CXSTAD]|''..|'.)$/;
const VALUE = new RegExp(`^${P}$`);
