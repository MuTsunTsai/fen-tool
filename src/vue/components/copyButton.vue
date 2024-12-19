<template>
	<button type="button" class="btn nowrap" :class="props.class" @click="copy" :disabled="disabled || state == 1">
		<i :class="['fa-solid fa-clipboard', 'fa-spin fa-solid fa-spinner', 'fa-solid fa-check'][state]"></i>&ensp;<slot></slot>
	</button>
</template>

<script setup lang="ts">
	import { shallowRef } from "vue";

	import { env } from "app/meta/env";
	import { ONE_SECOND } from "app/meta/constants";

	const props = defineProps<{
		class: string;
		factory: unknown | (() => string | Promise<unknown>);
		disabled?: boolean;
	}>();

	const state = shallowRef(0);

	async function copy(): Promise<void> {
		state.value = 1;
		try {
			let result = props.factory;
			while(typeof result == "function") {
				// eslint-disable-next-line no-await-in-loop
				result = await result();
			}
			if(typeof result == "string") copyText(result);
			state.value = 2;
			setTimeout(() => state.value = 0, ONE_SECOND);
		} catch(e) {
			state.value = 0;
		}
	}

	function copyText(text: string): void {
		if(env.canCopy) { navigator.clipboard.writeText(text); } else {
			// polyfill
			const input = document.createElement("input");
			document.body.appendChild(input);
			input.value = text;
			input.select();
			document.execCommand("copy");
			document.body.removeChild(input);
		}
	}

</script>
