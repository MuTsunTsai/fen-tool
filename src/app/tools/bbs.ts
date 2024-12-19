import { store } from "app/store";
import { createNormalSnapshot } from "app/interface/squares";
import { normalForsyth } from "./api";
import { env } from "app/meta/env";
import { BOARD_SIZE } from "app/meta/constants";
import { alert } from "app/meta/dialogs";
import { problemId } from "./pdb";

export const BBS = {
	async copy() {
		if(store.board.w != BOARD_SIZE || store.board.h != BOARD_SIZE) {
			alert("只支援標準棋盤");
			throw new Error();
		}
		gtag("event", "fen_bbs_copy");

		const ptt = await import(/* webpackChunkName: "ptt" */ "../modules/ptt/ptt");
		return ptt.generate(
			createNormalSnapshot(),
			normalForsyth(),
			problemId.value,
			store.BBS, store.board, env.isTouch
		);
	},
};
