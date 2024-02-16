import { shallowRef, watchEffect } from "vue";

import { alert } from "./meta/dialogs";
import { FEN } from "./meta/el";
import { store } from "./store";

export const Project = {
	reset() {
		store.project = [];
	},
	add() {
		store.project.push(makeEntry(FEN.value));
	},
	remove(i) {
		store.project.splice(i, 1);
	},
	async open(file) {
		const content = await readFile(file);
		try {
			const json = JSON.parse(content);
			if(typeof json.version !== "number" || !Array.isArray(json.project)) throw new Error();
			store.project = json.project;
		} catch {
			// try to parse the file
			const matches = content.match(
				// Regular expression for orthodox FEN
				/[kqbnrp1-8]{1,8}(?:\/[kqbnrp1-8]{1,8}){7}(?: [wb] (?:-|[kq]{1,4}) (?:-|[a-h][1-8]) \d+ \d+)?/gi
			);
			if(!matches || !matches.length) {
				alert("Unable to parse the file. It's not an FEN-Tool project file and it doesn't contain valid FENs.");
			}
			const entries = [];
			for(const [i, match] of matches.entries()) {
				entries.push(makeEntry(match), i);
			}
			store.project = entries;
		}
	},
	link: shallowRef(""),
};

function makeEntry(fen, offset = 0) {
	return {
		// We cannot assume that the data are unique, so we need an id for Slicksort.
		// Using timestamp is unique enough for our use case.
		id: Date.now() + offset,
		fen,
	};
}

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

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
function readFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = e => resolve(e.target.result);
		reader.onerror = e => reject(e);
		reader.readAsText(file);
	});
}
