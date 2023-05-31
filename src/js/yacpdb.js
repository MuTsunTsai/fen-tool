import { squares, setFEN } from "./squares";
import { store } from "./store";
import { makeFEN, toYACPDB } from "./fen.mjs";

const YACPDB = document.getElementById("YACPDB");

window.YACPDB = {
	copyFEN() {
		gtag("event", "yacpdb_copyFEN");
		const values = squares.map(s => toYACPDB(s.value));
		navigator.clipboard.writeText(makeFEN(values));
	},
	async fetch(bt) {
		try {
			gtag("event", "yacpdb_get");
			bt.disabled = true;
			bt.value = "Fetching...";
			const url = "https://yacpdb.org/gateway/ql?q=" + encodeURIComponent(`Id('${YACPDB.value}')`);
			const response = await fetch("https://corsproxy.io/?" + encodeURIComponent(url));
			const json = await response.json();
			if(json.success) {
				const list = json.result.entries[0].algebraic;
				const values = Array.from({ length: 64 }, () => "");
				function add(v) {
					const x = v.charCodeAt(1) - 97, y = Number(v[2]);
					values[(8 - y) * 8 + x] = v[0];
				}
				for(const b of list.black) add(b.toLowerCase());
				for(const w of list.white) add(w);
				setFEN(makeFEN(values));
			}
		} catch {
			alert("An error has occurred. Please try again later.");
		} finally {
			bt.disabled = false;
			bt.value = "Get FEN";
		}
	},
	search() {
		gtag("event", "yacpdb_search");
		window.open("https://yacpdb.org/#q/" + encodeURIComponent(createQuery()) + "/1");
	},
	copyQuery() {
		gtag("event", "yacpdb_copy");
		navigator.clipboard.writeText(createQuery());
	}
}

function createQuery() {
	let pieces = [];
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			let v = toYACPDB(squares[i * 8 + j].value).replace("(", "").replace(")", "");
			if(!v) continue;
			if(v.match(/\d/)) continue; // rotation not supported;
			if(v.startsWith("!")) v = "n" + v.toUpperCase();
			else v = (v == v.toLowerCase() ? "b" : "w") + v.toUpperCase();
			pieces.push(v + String.fromCharCode(97 + j) + (8 - i));
		}
	}
	let result = `MatrixExtended("${pieces.join(" ")}", false, false, "None")`;
	if(store.YACPDB.exact) result += " AND PCount(*) = " + pieces.length;
	return result;
}
