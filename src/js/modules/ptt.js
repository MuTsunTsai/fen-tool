import { isInUAO } from "./uao.mjs";

// This module is only loaded when needed.

const DIGITS = "０１２３４５６７８９".split("");

const fullWidthMap = (function() {
	const map = new Map();
	const FW1 = ("abcdefghijklmnopqrstuvwxyz"
		+ "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
		+ ",./<>?;':\"[]\\{}|!@#$%^&*()_+-=`~").split("");
	const FW2 = ("ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ"
		+ "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ"
		+ "，．／＜＞？；’：”〔〕＼｛｝｜！＠＃＄％︿＆＊（）ˍ＋－＝‘～").split("");
	for(let i = 0; i < FW1.length; i++) map.set(FW1[i], FW2[i]);
	for(let i = 0; i < 10; i++) map.set(i.toString(), DIGITS[i]);
	return map;
})();

const us = unescape("%1B");
const NOTES = "黑白,ｐＰ ＝ 小兵,ｒＲ ＝ 城堡,ｎＮ ＝ 騎士,ｂＢ ＝ 主教,ｑＱ ＝ 皇后,ｋＫ ＝ 國王,".split(",");
const UNCOLORED_NOTES = ",ｐ ＝ 小兵,ｒ ＝ 城堡,ｎ ＝ 騎士,ｂ ＝ 主教,ｑ ＝ 皇后,ｋ ＝ 國王,".split(",");

function fullWidth(value, useMarkers) {
	if(useMarkers && value.toLowerCase() == "c") return "‧";
	if(useMarkers && value.toLowerCase() == "x") return "╳";
	if(useMarkers && value.toLowerCase() == "s") return "■";
	if(useMarkers && value.toLowerCase() == "t") return "▲";
	if(useMarkers && value.toLowerCase() == "a") return "★";
	if(useMarkers && value.toLowerCase() == "d") return "◎";
	return fullWidthMap.get(value);
}

export function generate(squares, fen, id, bbs, options) {
	let result = "";
	for(let i = 0; i < 8; i++) {
		if(bbs.coordinates) result += us + "[m" + DIGITS[8 - i] + "　";
		for(let j = 0; j < 8; j++) {
			const bg = backgroundColor(i, j, options);
			let value = squares[i * 8 + j];
			value = value.replace(/^(-?)\*\d/, "$1"); // ignore rotation
			if(value.startsWith("-")) {
				value = value.substring(1);
				result += us + "[0;37;" + bg + fullWidth(value, true);
			} else if(value.startsWith("'")) {
				if(value.startsWith("''")) value = value.substring(2);
				else {
					value = value.substring(1);
					value = fullWidth(value) || (isInUAO(value) ? value : "　");
				}
				result += us + "[0;30;" + bg + value;
			} else if(value == "") {
				result += us + "[0;30;" + bg + "　";
			} else {
				result += us + "[";
				if(bbs.redBlue) {
					if(value == value.toUpperCase()) result += "1;31;";
					else result += "1;34;";
					result += bg + fullWidth(value.toLowerCase(), true);
				} else {
					if(value == value.toUpperCase()) result += "1;37;";
					else result += "0;30;";
					result += bg + fullWidth(value, true);
				}
			}
		}
		if(bbs.notes) result += us + "[m　　" + (bbs.uncoloredNotes ? UNCOLORED_NOTES[i] : NOTES[i]);
		if(i < 7) result += "\r\n";
	}
	result += us + "[m\r\n";
	if(bbs.Id) result += us + "[0;30;40m" + (id || "") + us + "[m";
	if(bbs.coordinates) result += "\r\n　　ａｂｃｄｅｆｇｈ\r\n"
	result += us + "[0;30;40m" + fen + us + "[m\r\n";
	return result;
};

function backgroundColor(i, j, options) {
	if(options.pattern == "mono") return "43;m";
	else return Boolean((i + j) % 2) == (options.pattern != "inverted") ? "42;m" : "43;m";
}