<template>
	<button type="button" class="btn nowrap" :class="props.class" @click="copy" :disabled="disabled || state == 1">
		<i :class="['fa-solid fa-clipboard', 'fa-spin fa-solid fa-spinner', 'fa-solid fa-check'][state]"></i>&ensp;<slot></slot>
	</button>
</template>

<script setup>
	import { shallowRef } from 'vue';
	import { env } from '../../js/meta/env';

	const props = defineProps({
		class: String,
		factory: [Function, String],
		disabled: Boolean,
	});

	const state = shallowRef(0);

	async function copy() {
		state.value = 1;
		try {
			let result = props.factory;
			while(typeof result == "function") {
				result = await result();
			}
			if(typeof result == "string") copyText(result);
			state.value = 2;
			setTimeout(() => state.value = 0, 1000);
		} catch(e) {
			state.value = 0;
		}
	}

	function copyText(text) {
		if(env.canCopy) navigator.clipboard.writeText(text);
		else {
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