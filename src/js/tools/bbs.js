import { store } from "../store";
import { normalSnapshot } from "../squares";
import { normalForsyth } from "./api";
import { DB } from "../meta/el";
import { env } from "../meta/env";

export const BBS = {
	async copy() {
		if(store.board.w != 8 || store.board.h != 8) {
			alert("只支援標準棋盤");
			throw true;
		}
		gtag("event", "fen_bbs_copy");
		const path = "./modules/ptt.js";
		const ptt = await import(path);
		return ptt.generate(normalSnapshot(), normalForsyth(), DB.value, store.BBS, store.board, env.isTouch);
	}
}