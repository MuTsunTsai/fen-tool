import { createSSRApp, watchEffect } from "vue";

import { store, state, status, initSession } from "./store";
import { updateEdwards } from "./interface/squares";
import { initLayout, setOption } from "./interface/layout";
import { initDrag } from "./interface/drag";
import { init as initSDK } from "./api/sdk-base";
import { moveHistory } from "./tools/play/play";
import { Popeye } from "./tools/popeye";
import "./tools/stockfish";
import "./tools/syzygy";
import App from "../vue/app.vue";

initSDK({
	getDefault: () => store.board,
	getTitle: (fen: string) => fen,
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
