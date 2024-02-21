import type { Color } from "../enum";

export type Ordering = "wb" | "bw";

export interface Problem {
	pg: boolean;
	fen: string;
	imitators: string[];
	ordering: Ordering;
}

export interface PopeyeOptions {
	imitators: string[];
	duplex: boolean;
	halfDuplex: boolean;
}

export interface ParseContext {
	duplexSeparator: string;
	initProblem: Problem;
	stipulations: string[];
	options: PopeyeOptions;
	state: ParseState;
}

export interface ParseState {
	stack: Entry[];
	stipIndex: number;
	solutionPrinted: boolean;
	currentProblem: Problem;
	board: Board;
	ordering: Ordering;
	imitators: string[];
}

export interface Entry {
	move: string;
	color: Color;
	fen: string;
	imitators: string[];
}

export interface Twin {
	fen: string;
	board: Board;
}
