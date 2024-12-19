<template>
	<section :class="{ show: state.tab == 7 }" v-show="state.tab == 7">
		<div class="mb-3">
			<Radio v-model="state.compute" label="Tool:" :text="['Popeye', 'Stockfish', 'Syzygy']" :value="['py', 'sf', 'sy']" />
		</div>
		<Popeye />
		<Stockfish />
		<Syzygy />
	</section>
</template>

<script setup lang="ts">
	import { state } from "app/store";
	import Popeye from "./popeye.vue";
	import Stockfish from "./stockfish.vue";
	import Syzygy from "./syzygy.vue";
	import Radio from "@/components/radio.vue";
</script>
