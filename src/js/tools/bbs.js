import { store } from "../store";
import { normalSnapshot } from "../squares";
import { normalForsyth } from "./api";
import { DB } from "../meta/el";
import { env } from "../meta/env";
import { BOARD_SIZE } from "../meta/constants";
import { alert } from "../meta/dialogs";

export const BBS = {
	async copy() {
		if(store.board.w != BOARD_SIZE || store.board.h != BOARD_SIZE) {
			alert("只支援標準棋盤");
			throw new Error();
		}
		gtag("event", "fen_bbs_copy");
		const path = "./modules/ptt.js";
		const ptt = await import(path);
		return ptt.generate(normalSnapshot(), normalForsyth(), DB.value, store.BBS, store.board, env.isTouch);
	},
};
