import { shallowRef } from "vue";

import { store } from "app/store";
import { squares, setFEN } from "app/interface/squares";
import { types } from "app/view/piece";
import { toSquare } from "app/meta/fen";
import { alert } from "app/meta/dialogs";

export const problemId = shallowRef("");

export const PDB = {
	async fetch(bt: HTMLButtonElement) {
		try {
			gtag("event", "fen_pdb_get");
			bt.disabled = true;
			bt.value = "Fetching...";
			const url = pdbURL + encodeURIComponent(`PROBID='${problemId.value}'`);
			const response = await fetch("https://corsproxy.io/?" + url);
			const text = await response.text();
			setFEN(text.match(/<b>FEN:<\/b> (.+)/)![1], true);
		} catch {
			alert("An error has occurred. Please try again later.");
		} finally {
			bt.disabled = false;
			bt.value = "Get FEN";
		}
	},
	search() {
		gtag("event", "fen_pdb_search");
		window.open(pdbURL + encodeURIComponent(createQuery()));
	},
	copyQuery() {
		gtag("event", "fen_pdb_copy");
		return createQuery();
	},
	copyEdit() {
		gtag("event", "fen_pdb_copyEdit");
		return createEdit();
	},
};

const pdbURL = "https://pdb.dieschwalbe.de/search.jsp?expression=";
const pdbMap = ["K", "D", "L", "S", "T", "B", "I"]; // German
const rotationMap = ["", "R", "U", "L"];

function createQuery(): string {
	const pieces = [];
	const { w, h } = store.board;
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			const v = squares[i * w + j].value;
			if(!v.match(/^[kqbsnrp]$/i)) continue; // only orthodox pieces are supported
			const type = pdbMap[types.indexOf(v.toLowerCase().replace("s", "n"))];
			const color = getColor(v);
			pieces.push(color + type + toSquare(i, j));
		}
	}
	let result = `POSITION='${pieces.join(" ")}'`;
	if(store.DB.exact) result += ` AND APIECES=${pieces.length}`;
	return result;
}

function createEdit(): string {
	const groups = {} as Record<string, string>;
	const { w, h } = store.board;
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			const v = squares[i * w + j].value;
			const match = v.match(/^(-?)(?:\*(\d))?([kqbsnrpxc])$/i);
			if(!match) continue;
			let key;
			if(match[3] == "x") {
				key = "sY"; // Special case
			} else {
				const type = pdbMap[types.indexOf(match[3].toLowerCase().replace("s", "n"))];
				const color = match[1] ? "n" : getColor(v);
				const rotation = rotationMap[Number(match[2] || 0)];
				key = color + type + rotation;
			}
			groups[key] = (groups[key] || "") + toSquare(i, j);
		}
	}
	const result = [];
	for(const key in groups) result.push(key + groups[key]);
	return result.join(" ");
}

function getColor(v: string): string {
	return v == v.toLowerCase() ? "s" : "w";
}
