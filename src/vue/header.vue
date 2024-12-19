<template>
	<header class="w-passive-100">
		<div class="row gx-3 mb-1">
			<div class="col mb-2" style="flex-basis: 15rem; flex-grow:1000;">
				<input type="text" class="form-control" placeholder="Enter FEN here" v-model="currentFEN" @change="FEN.update">
			</div>
			<div v-cloak class="col ps-0 mb-2 text-end" style="white-space:nowrap; flex-basis:max-content;">
				<label class="col-form-label pe-2" v-text="status.pieceCount"></label>
				<div v-if="status.envReady && env.canCopy" class="btn-group">
					<button class="btn btn-secondary" title="Copy" @click="copy">
						<i class="fa-solid fa-clipboard"></i>
					</button>
					<button v-if="env.canPaste" class="btn btn-secondary" :disabled="noEditing()" title="Paste" @click="paste">
						<i class="fa-solid fa-paste"></i>
					</button>
				</div>
			</div>
		</div>
	</header>
</template>

<script setup lang="ts">
	import { status, noEditing } from "app/store";
	import { env } from "app/meta/env";
	import { currentFEN, setFEN, FEN } from "app/interface/squares";
	import { readText } from "app/interface/copy";

	function copy(): void {
		gtag("event", "fen_copy");
		navigator.clipboard.writeText(currentFEN.value);
	}

	async function paste(): Promise<void> {
		gtag("event", "fen_paste");
		setFEN(await readText(), true);
	}
</script>
