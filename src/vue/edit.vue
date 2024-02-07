<template>
	<section :class="{ show: state.tab == 0 }">
		<div class="mb-3 btn-gap">
			<span class="d-inline-block">
				<button type="button" class="btn btn-secondary" onclick="FEN.empty()" :disabled="noEditing()" title="Empty board">
					<i class="fa-solid fa-trash-can"></i>
					<span>&ensp;Empty board</span>
				</button>
				<button type="button" class="btn btn-secondary" onclick="FEN.reset()" :disabled="noEditing()"
						title="Starting position">
					<i class="fa-solid fa-flag-checkered"></i>
					<span>&ensp;Starting position</span>
				</button>
			</span>
			<span class="btn-group">
				<button type="button" class="btn btn-secondary" title="Shift leftwards" onclick="FEN.shift(-1,0)"
						:disabled="noEditing()">
					<i class="fa-solid fa-arrow-left"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Shift rightwards" onclick="FEN.shift(1,0)"
						:disabled="noEditing()">
					<i class="fa-solid fa-arrow-right"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Shift upwards" onclick="FEN.shift(0,-1)"
						:disabled="noEditing()">
					<i class="fa-solid fa-arrow-up"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Shift downwards" onclick="FEN.shift(0,1)"
						:disabled="noEditing()">
					<i class="fa-solid fa-arrow-down"></i>
				</button>
			</span>
			<span class="btn-group">
				<button type="button" class="btn btn-secondary" title="Rotate counterclockwise" onclick="FEN.rotate(-1)"
						:disabled="noEditing()">
					<i class="fa-solid fa-rotate-left"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Rotate clockwise" onclick="FEN.rotate(1)"
						:disabled="noEditing()">
					<i class="fa-solid fa-rotate-right"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Mirror horizontally" onclick="FEN.mirror('-')"
						:disabled="noEditing()">
					<i class="fa-solid fa-arrows-left-right"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Mirror vertically" onclick="FEN.mirror('|')"
						:disabled="noEditing()">
					<i class="fa-solid fa-arrows-up-down"></i>
				</button>
			</span>
			<span class="btn-group">
				<button type="button" class="btn btn-secondary px-2" title="All Black" onclick="FEN.color(-1)"
						:disabled="noEditing()">
					<i class="fa-solid fa-chess-king fa-fw text-black shadow-white"></i>
				</button>
				<button type="button" class="btn btn-secondary px-2" title="All Neutral" onclick="FEN.color(0)"
						:disabled="noEditing()">
					<i v-if="!store.board.blackWhite" class="fa-solid fa-chess-king fa-fw shadow-neutral" style="color:gray;"></i>
					<template v-else>
						<i class="fa-solid fa-chess-king fa-fw text-black shadow-white"></i><i
						   class="fa-solid fa-chess-king fa-fw text-white shadow-black"
						   style="margin-left:-1.25em; clip-path: polygon(51.5% 0, 100% 0, 100% 100%, 51.5% 100%);"></i>
					</template>
				</button>
				<button type="button" class="btn btn-secondary px-2" title="All White" onclick="FEN.color(1)" :disabled="noEditing()">
					<i class="fa-solid fa-chess-king fa-fw text-white shadow-black"></i>
				</button>
			</span>
			<span class="btn-group">
				<button type="button" class="btn btn-secondary" title="Switch side" onclick="FEN.invert(false)"
						:disabled="noEditing()">
					<i class="fa-solid fa-chess-king text-black shadow-white"></i>&ensp;<i
					   class="fa-solid fa-arrows-left-right"></i>&ensp;<i class="fa-solid fa-chess-king text-white shadow-black"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Switch case (including text)" onclick="FEN.invert(true)"
						:disabled="noEditing()">
					A&ensp;<i class="fa-solid fa-arrows-left-right"></i>&ensp;a
				</button>
				<button v-if="!store.board.SN" type="button" class="btn btn-secondary"
						title="Change all S to N when 'Use S for knight' mode is off" onclick="FEN.fixSN()" :disabled="noEditing()">
					S&ensp;<i class="fa-solid fa-arrow-right"></i>&ensp;N
				</button>
			</span>
		</div>

		<div class="text-end btn-gap">
			<span class="d-inline-block">
				<CopyButton v-if="store.feature.janko" :factory="API.copyJanko" class="btn-primary">Create Janko URL</CopyButton>
				<CopyButton v-if="status.envReady && !env.isTouch" :factory="copyImage" class="btn-primary">Copy image</CopyButton>
				<CopyButton :factory="API.copyUrl" class="btn-primary">Create image URL</CopyButton>
			</span>
			<span class="d-inline-block">
				<button v-if="status.envReady && env.canShare" class="btn btn-primary" onclick="share(this)">
					<i class="fa-solid fa-share-nodes"></i>&ensp;Share image
				</button>
				<a class="btn btn-primary" download="board.png" id="Save" onclick="gtag('event', 'img_save')">
					<i class="fa-solid fa-download"></i>&ensp;Save image
				</a>
			</span>
		</div>

		<div class="mt-3 d-none d-md-block text-end" v-if="status.envReady && env.isTop">
			<div class="d-inline-block">
				<div class="form-check form-switch">
					<input class="form-check-input" type="checkbox" role="switch" id="sSplit" v-model="state.split">
					<label class="form-check-label" for="sSplit">Split window</label>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
	import { store, state, status, noEditing } from '../js/store';
	import { env } from '../js/meta/env';
	import { API } from "../js/tools/api";
	import { copyImage } from "../js/copy";

	import CopyButton from './components/copyButton.vue';
</script>