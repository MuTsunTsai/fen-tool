import { store } from "js/store";
import { normalSnapshot } from "js/interface/squares";
import { normalForsyth } from "./api";
import { env } from "js/meta/env";
import { BOARD_SIZE } from "js/meta/constants";
import { alert } from "js/meta/dialogs";
import { problemId } from "./pdb";

type PTT = typeof import("../modules/ptt/ptt");

export const BBS = {
	async copy() {
		if(store.board.w != BOARD_SIZE || store.board.h != BOARD_SIZE) {
			alert("只支援標準棋盤");
			throw new Error();
		}
		gtag("event", "fen_bbs_copy");
		const path = "./modules/ptt.js";
		const ptt = await import(path) as PTT;
		return ptt.generate(normalSnapshot(), normalForsyth(), problemId.value, store.BBS, store.board, env.isTouch);
	},
};
