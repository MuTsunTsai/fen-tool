import { squares, setFEN } from "app/interface/squares";
import { store } from "app/store";
import { makeForsyth, toYACPDB, toSquare, convertSN, emptyBoard } from "app/meta/fen";
import { alert } from "app/meta/dialogs";
import { CHAR_A_OFFSET } from "app/meta/constants";
import { problemId } from "./pdb";

export const YACPDB = {
	copyFEN() {
		gtag("event", "fen_yacpdb_copyFEN");
		const { w, h } = store.board;
		const values = squares.map(s => toYACPDB(s.value));
		return makeForsyth(values, w, h);
	},
	async fetch(bt: HTMLButtonElement) {
		try {
			gtag("event", "fen_yacpdb_get");
			bt.disabled = true;
			bt.value = "Fetching...";
			const url = "https://yacpdb.org/gateway/ql?q=" + encodeURIComponent(`Id('${problemId.value}')`);
			const response = await fetch("https://corsproxy.io/?" + url);
			const json = await response.json();
			if(json.success) {
				const { w, h } = store.board;
				const list = json.result.entries[0].algebraic;
				const values = emptyBoard(w * h);
				function add(v: string): void {
					const x = v.charCodeAt(1) - CHAR_A_OFFSET, y = Number(v[2]);
					values[(h - y) * w + x] = v[0];
				}
				for(const black of list.black) add(black.toLowerCase());
				for(const white of list.white) add(white);
				setFEN(makeForsyth(values, w, h));
			}
		} catch {
			alert("An error has occurred. Please try again later.");
		} finally {
			bt.disabled = false;
			bt.value = "Get FEN";
		}
	},
	search() {
		gtag("event", "fen_yacpdb_search");
		window.open("https://yacpdb.org/#q/" + encodeURIComponent(createQuery()) + "/1");
	},
	copyQuery() {
		gtag("event", "fen_yacpdb_copy");
		return createQuery();
	},
	copyEdit() {
		gtag("event", "fen_yacpdb_copyEdit");
		return createEdit();
	},
};

function createQuery(): string {
	const pieces = [];
	const { w, h } = store.board;
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			let v = toYACPDB(squares[i * w + j].value).replace("(", "").replace(")", "");
			if(!v) continue;
			if(v.match(/\d/)) continue; // rotation not supported;
			if(v.startsWith("!")) v = "n" + v.toUpperCase();
			else v = getColor(v) + v.toUpperCase();
			pieces.push(v + toSquare(i, j));
		}
	}
	let result = `MatrixExtended("${pieces.join(" ")}", false, false, "None")`;
	if(store.DB.exact) result += " AND PCount(*) = " + pieces.length;
	return result;
}

function createEdit(): string {
	const groups = { w: [] as string[], b: [] as string[], n: [] as string[] };
	const { w, h } = store.board;
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			const v = squares[i * w + j].value;
			const match = v.match(/^(-?)([kqbsnrp])$/i);
			if(!match) continue;
			const type = convertSN(match[2], false, true).toUpperCase();
			const color = match[1] ? "n" : getColor(v);
			groups[color].push(type + toSquare(i, j));
		}
	}
	const result = [];
	if(groups.w.length) result.push(`    white: [${groups.w.join(", ")}]`);
	if(groups.b.length) result.push(`    black: [${groups.b.join(", ")}]`);
	if(groups.n.length) result.push(`    neutral: [${groups.n.join(", ")}]`);
	return result.join("\n");
}

function getColor(v: string): "b" | "w" {
	return v == v.toLowerCase() ? "b" : "w";
}
