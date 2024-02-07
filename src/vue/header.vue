<template>
	<header class="w-passive-100">
		<div class="row gx-3 mb-1">
			<div class="col mb-2" style="flex-basis: 15rem; flex-grow:1000;">
				<input type="text" class="form-control" placeholder="Enter FEN here" id="FEN" onchange="FEN.update()">
			</div>
			<div v-cloak class="col ps-0 mb-2 text-end" style="white-space:nowrap; flex-basis:max-content;">
				<label class="col-form-label pe-2" v-text="status.pieceCount"></label>
				<div v-if="status.envReady && env.canCopy" class="btn-group">
					<button class="btn btn-secondary" title="Copy" onclick="FEN.copy()">
						<i class="fa-solid fa-clipboard"></i>
					</button>
					<button v-if="env.canPaste" class="btn btn-secondary" :disabled="noEditing()" title="Paste" onclick="FEN.paste()">
						<i class="fa-solid fa-paste"></i>
					</button>
				</div>
			</div>
		</div>
	</header>
</template>

<script setup>
	import { status, noEditing } from '../js/store';
	import { env } from '../js/meta/env';
</script>