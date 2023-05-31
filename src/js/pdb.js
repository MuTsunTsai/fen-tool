import { store } from "./store";
import { squares } from "./squares";
import { types } from "./render";

export const PDB = document.getElementById("PDB");

window.PDB = {
	async fetch(bt) {
		try{
			gtag("event", "pdb_get");
			bt.disabled = true;
			bt.value = "Fetching...";
			const url = pdbURL + encodeURIComponent(`PROBID='${PDB.value}'`);
			const response = await fetch("https://corsproxy.io/?" + encodeURIComponent(url));
			const text = await response.text();
			setFEN(text.match(/<b>FEN:<\/b> (.+)/)[1], true);
		} catch {
			alert("An error has occurred. Please try again later.");
		} finally {
			bt.disabled = false;
			bt.value = "Get FEN";
		}
	},
	search() {
		gtag("event", "pdb_search");
		window.open(pdbURL + encodeURIComponent(createQuery()));
	},
	copyQuery() {
		gtag("event", "pdb_copy");
		navigator.clipboard.writeText(createQuery());
	}
}

const pdbURL = "https://pdb.dieschwalbe.de/search.jsp?expression="
const pdbMap = ["K", "D", "L", "S", "T", "B"]; // German

function createQuery() {
	let pieces = [];
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			const v = squares[i * 8 + j].value;
			if(!v.match(/^[kqbsnrp]$/i)) continue; // only orthodox pieces are supported
			const type = pdbMap[types.indexOf(v.toLowerCase().replace("s", "n"))];
			const color = v == v.toLowerCase() ? "s" : "w";
			pieces.push(color + type + String.fromCharCode(97 + j) + (8 - i));
		}
	}
	let result = `POSITION='${pieces.join(" ")}'`;
	if(store.PDB.exact) result += ` AND APIECES=${pieces.length}`;
	return result;
}
