import { store } from "js/store";
import { createNormalSnapshot } from "js/interface/squares";
import { normalForsyth } from "./api";
import { env } from "js/meta/env";
import { BOARD_SIZE } from "js/meta/constants";
import { alert } from "js/meta/dialogs";
import { problemId } from "./pdb";

import type * as ptt from "js/modules/ptt/ptt";

type PTT = typeof ptt;

export const BBS = {
	async copy() {
		if(store.board.w != BOARD_SIZE || store.board.h != BOARD_SIZE) {
			alert("只支援標準棋盤");
			throw new Error();
		}
		gtag("event", "fen_bbs_copy");

		// break into 2 lines to prevent bundling
		const path = "./modules/ptt.js";
		const ptt = await import(path) as PTT;
		return ptt.generate(
			createNormalSnapshot(),
			normalForsyth(),
			problemId.value,
			store.BBS, store.board, env.isTouch
		);
	},
};
