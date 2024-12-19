<template>
	<button v-if="status.envReady && env.canShare" class="btn btn-primary" :disabled="sharing" @click="share">
		<i  :class="sharing ? 'fa-spin fa-solid fa-spinner' : 'fa-solid fa-share-nodes'"></i>&ensp;Share image
	</button>
</template>

<script setup lang="ts">
	import { shallowRef } from "vue";

	import { status } from "app/store";
	import { env } from "app/meta/env";
	import { API, normalForsyth } from "app/tools/api";
	import { getBlob } from "app/view/render";

	const sharing = shallowRef(false);

	async function share(): Promise<void> {
		gtag("event", "fen_img_share");
		if(env.canSharePng) {
			const blob = await getBlob();
			const files = [new File([blob], "board.png", { type: "image/png" })];
			navigator.share({ files });
		} else {
			// Firefox Android fallback mode
			sharing.value = true;
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
				if(sharing.value) sharing.value = false;
			}
		}
	}
</script>
