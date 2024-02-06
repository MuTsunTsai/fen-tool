import { shallowRef, watchEffect } from "vue";

import { FEN } from "./meta/el";
import { store } from "./store";

export const Project = {
	reset() {
		store.project = [];
	},
	add() {
		store.project.push({
			// We cannot assume that the data are unique, so we need an id for Slicksort.
			// Using timestamp is unique enough for our use case.
			id: Date.now(),
			fen: FEN.value,
		});
	},
	remove(i) {
		store.project.splice(i, 1);
	},
	async open(file) {
		const json = await readFile(file);
		store.project = JSON.parse(json).project;
	},
	link: shallowRef(""),
};

watchEffect(() => {
	const content = JSON.stringify({
		version: 1,
		project: store.project
	});
	const blob = new Blob([content], { type: "application/fen.tool.project+json" });
	const link = URL.createObjectURL(blob);
	if(Project.link.value) URL.revokeObjectURL(Project.link.value);
	Project.link.value = link;
});

function readFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = e => resolve(e.target.result);
		reader.onerror = e => reject(e);
		reader.readAsText(file);
	});
}