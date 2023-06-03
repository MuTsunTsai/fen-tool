import { store } from "../store";
import { FEN } from "../el";
import { PDB } from "./pdb";
import { squares } from "../squares";
import { DIGITS, fullWidth } from "../fullWidth";

const us = unescape("%1B");
export const A2 = "黑白,ｐＰ ＝ 小兵,ｒＲ ＝ 城堡,ｎＮ ＝ 騎士,ｂＢ ＝ 主教,ｑＱ ＝ 皇后,ｋＫ ＝ 國王,".split(",");
export const A3 = ",ｐ ＝ 小兵,ｒ ＝ 城堡,ｎ ＝ 騎士,ｂ ＝ 主教,ｑ ＝ 皇后,ｋ ＝ 國王,".split(",");

export const BBS = {
	copy() {
		let result = "";
		let value;
		function ignoreRotation() { // 忽略旋轉
			if(value.startsWith("*")) value = value.substring(2);
		}
		for(let i = 0; i < 8; i++) {
			if(store.BBS.coordinates) result += us + "[m" + DIGITS[8 - i] + "　";
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
		if(store.BBS.Id) result += us + "[0;30;40m" + PDB.value + us + "[m";
		if(store.BBS.coordinates) result += "\r\n　　ａｂｃｄｅｆｇｈ\r\n"
		result += us + "[0;30;40m" + FEN.value + us + "[m\r\n";
		gtag("event", "fen_bbs_copy");
		return result;
	},
};

function BackgroundColor(i, j) {
	if(store.board.pattern == "mono") return "43;m";
	else return Boolean((i + j) % 2) == (store.board.pattern != "inverted") ? "42;m" : "43;m";
}
