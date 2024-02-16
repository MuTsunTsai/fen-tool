import { createSSRApp, watchEffect } from "vue";

import { store, state, status, initSession } from "./store";
import { updateEdwards } from "./squares";
import { getBlob } from "./render";
import { initLayout, setOption } from "./layout";
import { initDrag } from "./drag";
import { env } from "./meta/env";
import { init as initSDK } from "./api/sdk-base";
import { API, normalForsyth } from "./tools/api";
import { moveHistory } from "./tools/play";
import { Popeye } from "./tools/popeye";
import "./tools/stockfish";
import "./tools/syzygy";
import App from "../vue/app.vue";

initSDK({
	getDefault: () => store.board,
	getTitle: fen => fen,
});

// https://stackoverflow.com/a/43321596/9953396
document.addEventListener("mousedown", (event) => {
	const el = document.activeElement?.nodeName.toLowerCase();
	if(el == "input" || el == "textarea") return;
	if(event.detail > 1) event.preventDefault();
}, false);

addEventListener("keydown", e => {
	if(!state.play.playing && !state.popeye.playing) return;
	const el = document.activeElement?.nodeName.toLowerCase();
	if(el == "input" || el == "textarea") return;
	const k = e.key;
	if(k == "a" || k == "ArrowLeft") {
		e.preventDefault();
		if(state.play.playing) moveHistory(-1);
		else Popeye.moveBy(-1);
	}
	if(k == "d" || k == "ArrowRight") {
		e.preventDefault();
		if(state.play.playing) moveHistory(1);
		else Popeye.moveBy(1);
	}
});

//===========================================================
// export
//===========================================================

window.share = async function(bt) {
	gtag("event", "fen_img_share");
	if(env.canSharePng) {
		const blob = await getBlob();
		const files = [new File([blob], "board.png", { type: "image/png" })];
		navigator.share({ files });
	} else {
		// Firefox Android fallback mode
		bt.disabled = true;
		const i = bt.querySelector("i");
		const old = i.className;
		i.className = "fa-spin fa-solid fa-spinner";
		try {
			const url = await API.copyUrl();
			navigator.share({
				url,
				// Actually FF Android hasn't implement `text` parameter yet,
				// but it won't hurt adding it either.
				// See https://caniuse.com/mdn-api_navigator_canshare_data_text_parameter
				text: normalForsyth(),
			});
		} finally {
			if(bt.disabled) {
				bt.disabled = false;
				i.className = old;
			}
		}
	}
};

//===========================================================
// startup
//===========================================================

createSSRApp(App).mount("#app");
status.envReady = true;

initSession();
initLayout();
initDrag();

watchEffect(() => {
	document.body.classList.toggle("split", state.split);
	Promise.resolve().then(() => setOption({}));
});
watchEffect(updateEdwards);
