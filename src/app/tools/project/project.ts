import { shallowRef, watchEffect } from "vue";

import { alert, confirm } from "app/meta/dialogs";
import { state, store } from "app/store";
import { currentFEN } from "app/interface/squares";
import { makeEntry } from "./entry";
import { getPopeyeFEN } from "../popeye/popeye";

import type { ProjectEntry } from "./entry";
import type * as Olive from "../popeye/olive";

function getOlive(): Promise<typeof Olive> {
	return import("../popeye/olive");
}

function parseFenToolFormat(content: string): ProjectEntry[] | null {
	try {
		const json = JSON.parse(content);
		if(typeof json.version !== "number" || !Array.isArray(json.project)) throw new Error();
		return json.project;
	} catch {
		return null;
	}
}

function parseTextFormat(content: string): ProjectEntry[] | null {
	// try to parse the file
	const matches = content.match(
		// Regular expression for orthodox FEN
		/[kqbnrp1-8]{1,8}(?:\/[kqbnrp1-8]{1,8}){7}(?: [wb] (?:-|[kq]{1,4}) (?:-|[a-h][1-8]) \d+ \d+)?/gi
	);
	if(!matches || !matches.length) return null;
	const entries: ProjectEntry[] = [];
	for(const [i, match] of matches.entries()) {
		entries.push(makeEntry({ fen: match }, i));
	}
	return entries;
}

export const Project = {
	async reset() {
		if(store.project.length && await confirm("Are you sure you want to clear all entries?")) {
			if(store.project.length) store.project = [];
		}
	},
	async add(popeye?: boolean) {
		if(popeye) {
			const olive = await getOlive();
			let input = state.popeye.input;
			const info = getPopeyeFEN(input);
			input = olive.normalizeInput(input, info);
			store.project.push(makeEntry({ fen: info.fen, popeye: input }));
		} else {
			store.project.push(makeEntry({ fen: currentFEN.value }));
		}
	},
	remove(i: number) {
		store.project.splice(i, 1);
	},
	async open(file: File) {
		const content = await readFile(file);
		const olive = await getOlive();
		for(const parser of [parseFenToolFormat, olive.parseOliveFormat, parseTextFormat]) {
			const project = parser(content);
			if(project) {
				store.project = project;
				return;
			}
		}
		alert("Unable to parse the file. The format cannot be recognized.");
	},
	link: shallowRef(""),
};

watchEffect(() => {
	const content = JSON.stringify({
		version: 1,
		project: store.project,
	});
	const blob = new Blob([content], { type: "application/fen.tool.project+json" });
	const link = URL.createObjectURL(blob);
	if(Project.link.value) URL.revokeObjectURL(Project.link.value);
	Project.link.value = link;
});

function readFile(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = e => resolve(e.target!.result as string);
		reader.onerror = e => reject(e);
		reader.readAsText(file);
	});
}
