<template>
	<section :class="{ show: state.tab == 4 }" v-if="status.envReady && env.isTaiwan">
		<div class="row gx-3">
			<div class="col flex-grow-1 mb-3" style="flex-basis: max-content;">
				<Checkbox v-model="store.BBS.Id">Include database Id</Checkbox>
				<Checkbox v-model="store.BBS.coordinates">Include Coordinates</Checkbox>
				<Checkbox v-model="store.BBS.notes">Include Notes</Checkbox>
				<Checkbox v-model="store.BBS.uncoloredNotes">Uncolored Note</Checkbox>
				<Checkbox v-model="store.BBS.redBlue">Use Red and Blue in BBS Code</Checkbox>
			</div>
			<div class="col flex-grow-1 text-end">
				<CopyButton :factory="BBS.copy" class="btn-primary">Copy BBS Code</CopyButton>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { state, status, store } from "app/store";
	import { env } from "app/meta/env";
	import { BBS } from "app/tools/bbs";
	import Checkbox from "@/components/checkbox.vue";
	import CopyButton from "@/components/copyButton.vue";
</script>
