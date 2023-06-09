import { store } from "../store";
import { normalSnapshot } from "../squares";
import { normalFEN } from "./api";
import { DB } from "../meta/el";

export const BBS = {
	async copy() {
		if(store.board.w != 8 || store.board.h != 8) {
			alert("只支援標準棋盤");
			throw true;
		}
		gtag("event", "fen_bbs_copy");
		const ptt = await import("./modules/ptt.js");
		return ptt.generate(normalSnapshot(), normalFEN(), DB.value, store.BBS, store.board);
	}
}