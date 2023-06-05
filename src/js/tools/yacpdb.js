import { squares, setFEN } from "../squares";
import { store } from "../store";
import { makeFEN, toYACPDB, toCoordinate, convertSN } from "../meta/fen.mjs";
import { DB } from "../meta/el";

export const YACPDB = {
	copyFEN() {
		gtag("event", "fen_yacpdb_copyFEN");
		const { w, h } = store.board;
		const values = squares.map(s => toYACPDB(s.value));
		return makeFEN(values, w, h);
	},
	async fetch(bt) {
		try {
			gtag("event", "fen_yacpdb_get");
			bt.disabled = true;
			bt.value = "Fetching...";
			const url = "https://yacpdb.org/gateway/ql?q=" + encodeURIComponent(`Id('${DB.value}')`);
			const response = await fetch("https://corsproxy.io/?" + encodeURIComponent(url));
			const json = await response.json();
			if(json.success) {
				const { w, h } = store.board;
				const list = json.result.entries[0].algebraic;
				const values = Array.from({ length: h * w }, () => "");
				function add(v) {
					const x = v.charCodeAt(1) - 97, y = Number(v[2]);
					values[(h - y) * w + x] = v[0];
				}
				for(const b of list.black) add(b.toLowerCase());
				for(const w of list.white) add(w);
				setFEN(makeFEN(values), w, h);
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
	}
};

function createQuery() {
	let pieces = [];
	const { w, h } = store.board;
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			let v = toYACPDB(squares[i * w + j].value).replace("(", "").replace(")", "");
			if(!v) continue;
			if(v.match(/\d/)) continue; // rotation not supported;
			if(v.startsWith("!")) v = "n" + v.toUpperCase();
			else v = (v == v.toLowerCase() ? "b" : "w") + v.toUpperCase();
			pieces.push(v + toCoordinate(i, j));
		}
	}
	let result = `MatrixExtended("${pieces.join(" ")}", false, false, "None")`;
	if(store.DB.exact) result += " AND PCount(*) = " + pieces.length;
	return result;
}

function createEdit() {
	const groups = { w: [], b: [], n: [] };
	const { w, h } = store.board;
	for(let i = 0; i < h; i++) {
		for(let j = 0; j < w; j++) {
			const v = squares[i * w + j].value;
			const match = v.match(/^(-?)([kqbsnrp])$/i);
			if(!match) continue;
			const type = convertSN(match[2]).toUpperCase();
			const color = match[1] ? "n" : v == v.toLowerCase() ? "b" : "w";
			groups[color].push(type + toCoordinate(i, j));
		}
	}
	let result = [];
	if(groups.w.length) result.push(`    white: [${groups.w.join(", ")}]`);
	if(groups.b.length) result.push(`    black: [${groups.b.join(", ")}]`);
	if(groups.n.length) result.push(`    neutral: [${groups.n.join(", ")}]`);
	return result.join("\n");
}