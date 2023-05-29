import { store } from "./store";
import { FEN } from "./el";
import { PDB } from "./pdb";

const fullWidthMap = (function() {
	const map = new Map();
	const FW1 = ("abcdefghijklmnopqrstuvwxyz"
		+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		+ ",./<>?;':\"[]\\{}|!@#$%^&*()_+-=`~").split("");
	const FW2 = ("ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ"
		+ "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ"
		+ "，．／＜＞？；’：”〔〕＼｛｝｜！＠＃＄％︿＆＊（）ˍ＋－＝‘～").split("");
	for(let i = 0; i < FW1.length; i++) map.set(FW1[i], FW2[i]);
	return map;
})();

const us = unescape("%1B");
const A1 = "０１２３４５６７８９".split("");
const A2 = "黑白,ｐＰ ＝ 小兵,ｒＲ ＝ 城堡,ｎＮ ＝ 騎士,ｂＢ ＝ 主教,ｑＱ ＝ 皇后,ｋＫ ＝ 國王,".split(",");
const A3 = ",ｐ ＝ 小兵,ｒ ＝ 城堡,ｎ ＝ 騎士,ｂ ＝ 主教,ｑ ＝ 皇后,ｋ ＝ 國王,".split(",");

window.generateBBS = function() {
	let fen = [...FEN.value.replace(/\//g, "")];
	let result = "";
	let char;
	let cursor = 0;

	function ignoreRotation() { // 忽略旋轉
		if(char == "*") {
			cursor += 2;
			char = fen[cursor];
		}
	}

	for(let i = 0; i < 8; i++) {
		if(store.BBS.coordinates) result += us + "[m" + A1[8 - i] + "　";
		for(let j = 0; j < 8; j++) {
			char = fen[cursor];
			ignoreRotation();
			if(char == "~") {
				cursor++;
				char = fen[cursor];
			}
			if(char == "-") {
				cursor++;
				char = fen[cursor];
				ignoreRotation();
				result += us + "[0;37;" + BackgroundColor(i, j) + fullWidth(char, true);
			} else if(char == "'") {
				result += us + "[0;30;";
				result += BackgroundColor(i, j);
				if(fen[cursor + 1] == "'") {
					result += fen.slice(cursor + 2, cursor + 4).join("");
					cursor += 3;
				} else {
					if(fen[cursor + 1].match(/\d/)) {
						result += A1[Number(fen[cursor + 1])];
					} else {
						result += fullWidth(fen[cursor + 1], false);
					}
					cursor++;
				}
			} else if(char.match(/\d/)) {
				let n = Number(char);
				for(let k = 0; k < n; k++) {
					if(k) {
						j++;
						if(j == 8) {
							i++;
							j = 0;
						}
					}
					result += us + "[0;30;";
					result += BackgroundColor(i, j);
					result += "　";
				}
			} else {
				result += us + "[";
				if(store.BBS.redBlue) {
					if(char == char.toUpperCase()) result += "1;31;";
					else result += "1;34;";
					result += BackgroundColor(i, j) + fullWidth(char.toLowerCase(), true);
				} else {
					if(char == char.toUpperCase()) result += "1;37;";
					else result += "0;30;";
					result += BackgroundColor(i, j) + fullWidth(char, true);
				}
			}
			cursor++;
		}
		if(store.BBS.notes) result += us + "[m　　" + (store.BBS.uncoloredNotes ? A3[i] : A2[i]);
		if(i < 7) result += "\r\n";
	}
	result += us + "[m\r\n";
	if(store.BBS.PDB) result += us + "[0;30;40m" + PDB.value + us + "[m";
	if(store.BBS.coordinates) result += "\r\n　　ａｂｃｄｅｆｇｈ\r\n"
	result += us + "[0;30;40m" + FEN.value + us + "[m\r\n";
	gtag("event", "bbs_copy");
	navigator.clipboard.writeText(result);
}

function BackgroundColor(i, j) {
	if(store.board.uncolored) return "43;m";
	else return (i + j) % 2 ? "42;m" : "43;m";
}

export function fullWidth(s, t) {
	if(t && s.toLowerCase() == "c") return "‧";
	if(t && s.toLowerCase() == "x") return "╳";
	return fullWidthMap.get(s);
}
