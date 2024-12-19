import { BOARD_SIZE } from "../../meta/constants";
import { fullWidthMap, DIGITS, UNCOLORED_NOTES, NOTES } from "./data";
import { isInUAO } from "./uao";

import type { BbsOptions } from "./data";
import type { BoardOptions } from "app/meta/option";

function fullWidth(value: string, useMarkers?: boolean): string {
	if(useMarkers && value.toLowerCase() == "c") return "‧";
	if(useMarkers && value.toLowerCase() == "x") return "╳";
	if(useMarkers && value.toLowerCase() == "s") return "■";
	if(useMarkers && value.toLowerCase() == "t") return "▲";
	if(useMarkers && value.toLowerCase() == "a") return "★";
	if(useMarkers && value.toLowerCase() == "d") return "◎";
	return fullWidthMap.get(value);
}

export function generate(
	squares: string[], fen: string, id: string,
	bbs: BbsOptions, options: BoardOptions, isTouch: boolean
): string {
	const us = (isTouch ? "*" : unescape("%1B")) + "[";
	let result = "";
	for(let i = 0; i < BOARD_SIZE; i++) {
		if(bbs.coordinates) result += us + "m" + DIGITS[BOARD_SIZE - i] + "　";
		for(let j = 0; j < BOARD_SIZE; j++) {
			const bg = backgroundColor(i, j, options);
			let value = squares[i * BOARD_SIZE + j];
			value = value.replace(/^(-?)\*\d/, "$1"); // ignore rotation
			result += square(bbs, value, us, bg);
		}
		if(bbs.notes) result += us + "m　　" + (bbs.uncoloredNotes ? UNCOLORED_NOTES[i] : NOTES[i]);
		if(i < BOARD_SIZE - 1) result += "\n";
	}
	result += us + "m\n";
	if(bbs.Id) result += us + ";30;40m" + (id || "") + us + "m";
	if(bbs.coordinates) result += "\n　　ａｂｃｄｅｆｇｈ\n";
	result += us + ";30;40m" + fen + us + "m\n";
	return result;
}

function square(bbs: BbsOptions, value: string, us: string, bg: string): string {
	let result = "";
	if(value.startsWith("-")) {
		value = value.substring(1);
		result += us + ";37;" + bg + fullWidth(value, true);
	} else if(value.startsWith("'")) {
		if(value.startsWith("''")) { value = value.substring(2); } else {
			value = value.substring(1);
			value = fullWidth(value) || (isInUAO(value) ? value : "　");
		}
		result += us + ";30;" + bg + value;
	} else if(value == "") {
		result += us + ";30;" + bg + "　";
	} else {
		result += us + piece(bbs, bg, value);
	}
	return result;
}

function piece(bbs: BbsOptions, bg: string, value: string): string {
	let result = "";
	if(bbs.redBlue) {
		if(value == value.toUpperCase()) result += "1;31;";
		else result += "1;34;";
		result += bg + fullWidth(value.toLowerCase(), true);
	} else {
		if(value == value.toUpperCase()) result += "1;37;";
		else result += ";30;";
		result += bg + fullWidth(value, true);
	}
	return result;
}

function backgroundColor(i: number, j: number, options: BoardOptions): string {
	if(options.pattern == "mono") return "43m";
	else return Boolean((i + j) % 2) == (options.pattern != "inverted") ? "42m" : "43m";
}
