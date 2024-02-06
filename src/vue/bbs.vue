<template>
	<section :class="{ show: state.tab == 4 }" v-if="status.envReady && env.isTaiwan">
		<div class="row gx-3">
			<div class="col flex-grow-1 mb-3" style="flex-basis: max-content;">
				<Checkbox v-model="BBS.Id">Include database Id</Checkbox>
				<Checkbox v-model="BBS.coordinates">Include Coordinates</Checkbox>
				<Checkbox v-model="BBS.notes">Include Notes</Checkbox>
				<Checkbox v-model="BBS.uncoloredNotes">Uncolored Note</Checkbox>
				<Checkbox v-model="BBS.redBlue">Use Red and Blue in BBS Code</Checkbox>
			</div>
			<div class="col flex-grow-1 text-end">
				<CopyButton :factory="BBS.copy" class="btn-primary">Copy BBS Code</CopyButton>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { state, status } from '../js/store';
	import { env } from '../js/meta/env';
	import { BBS } from "../js/tools/bbs";
	import Checkbox from "./components/checkbox.vue";
	import CopyButton from "./components/copyButton.vue";
</script>