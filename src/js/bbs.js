import { store } from "./store";
import { FEN } from "./el";
import { PDB } from "./pdb";
import { squares } from "./squares";

const us = unescape("%1B");
const A1 = "０１２３４５６７８９".split("");
const A2 = "黑白,ｐＰ ＝ 小兵,ｒＲ ＝ 城堡,ｎＮ ＝ 騎士,ｂＢ ＝ 主教,ｑＱ ＝ 皇后,ｋＫ ＝ 國王,".split(",");
const A3 = ",ｐ ＝ 小兵,ｒ ＝ 城堡,ｎ ＝ 騎士,ｂ ＝ 主教,ｑ ＝ 皇后,ｋ ＝ 國王,".split(",");

const fullWidthMap = (function() {
	const map = new Map();
	const FW1 = ("abcdefghijklmnopqrstuvwxyz"
		+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		+ ",./<>?;':\"[]\\{}|!@#$%^&*()_+-=`~").split("");
	const FW2 = ("ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ"
		+ "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ"
		+ "，．／＜＞？；’：”〔〕＼｛｝｜！＠＃＄％︿＆＊（）ˍ＋－＝‘～").split("");
	for(let i = 0; i < FW1.length; i++) map.set(FW1[i], FW2[i]);
	for(let i = 0; i < 10; i++) map.set(i.toString(), A1[i]);
	return map;
})();

window.BBS = {
	copy() {
		let result = "";
		let value;
		function ignoreRotation() { // 忽略旋轉
			if(value.startsWith("*")) value = value.substring(2);
		}
		for(let i = 0; i < 8; i++) {
			if(store.BBS.coordinates) result += us + "[m" + A1[8 - i] + "　";
			for(let j = 0; j < 8; j++) {
				value = squares[i * 8 + j].value;
				ignoreRotation();
				if(value.startsWith("-")) {
					value = value.substring(1);
					ignoreRotation();
					result += us + "[0;37;" + BackgroundColor(i, j) + fullWidth(value, true);
				} else if(value.startsWith("'")) {
					if(value.startsWith("''")) value = value.substring(2);
					else value = fullWidth(value.substring(1));
					result += us + "[0;30;" + BackgroundColor(i, j) + value;
				} else if(value == "") {
					result += us + "[0;30;" + BackgroundColor(i, j) + "　";
				} else {
					result += us + "[";
					if(store.BBS.redBlue) {
						if(value == value.toUpperCase()) result += "1;31;";
						else result += "1;34;";
						result += BackgroundColor(i, j) + fullWidth(value.toLowerCase(), true);
					} else {
						if(value == value.toUpperCase()) result += "1;37;";
						else result += "0;30;";
						result += BackgroundColor(i, j) + fullWidth(value, true);
					}
				}
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
	},
};

function BackgroundColor(i, j) {
	if(store.board.uncolored) return "43;m";
	else return (i + j) % 2 ? "42;m" : "43;m";
}

export function fullWidth(s, t) {
	if(t && s.toLowerCase() == "c") return "‧";
	if(t && s.toLowerCase() == "x") return "╳";
	return fullWidthMap.get(s);
}
