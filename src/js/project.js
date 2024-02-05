import { FEN } from "./meta/el";
import { store } from "./store";

export const Project = {
	add() {
		store.project.push({
			fen: FEN.value,
		});
	},
	remove(i) {
		store.project.splice(i, 1);
	},
}