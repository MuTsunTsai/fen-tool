<template>
	<section :class="{ show: state.tab == 0 }">
		<div class="mb-3 btn-gap">
			<span class="d-inline-block">
				<button type="button" class="btn btn-secondary" @click="FEN.empty" :disabled="noEditing()" title="Empty board">
					<i class="fa-solid fa-trash-can"></i>
					<span>&ensp;Empty board</span>
				</button>
				<button type="button" class="btn btn-secondary" @click="FEN.reset()" :disabled="noEditing()"
						title="Starting position">
					<i class="fa-solid fa-flag-checkered"></i>
					<span>&ensp;Starting position</span>
				</button>
			</span>
			<span class="btn-group">
				<button type="button" class="btn btn-secondary" title="Shift leftwards" @click="shiftBy(-1, 0)"
						:disabled="noEditing()">
					<i class="fa-solid fa-arrow-left"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Shift rightwards" @click="shiftBy(1, 0)"
						:disabled="noEditing()">
					<i class="fa-solid fa-arrow-right"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Shift upwards" @click="shiftBy(0, -1)" :disabled="noEditing()">
					<i class="fa-solid fa-arrow-up"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Shift downwards" @click="shiftBy(0, 1)"
						:disabled="noEditing()">
					<i class="fa-solid fa-arrow-down"></i>
				</button>
			</span>
			<span class="btn-group">
				<button type="button" class="btn btn-secondary" title="Rotate counterclockwise" @click="rotateBy(-1)"
						:disabled="noEditing()">
					<i class="fa-solid fa-rotate-left"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Rotate clockwise" @click="rotateBy(1)" :disabled="noEditing()">
					<i class="fa-solid fa-rotate-right"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Mirror horizontally" @click="mirrorBy('-')"
						:disabled="noEditing()">
					<i class="fa-solid fa-arrows-left-right"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Mirror vertically" @click="mirrorBy('|')"
						:disabled="noEditing()">
					<i class="fa-solid fa-arrows-up-down"></i>
				</button>
			</span>
			<span class="btn-group">
				<button type="button" class="btn btn-secondary px-2" title="All Black" @click="FEN.color(-1)"
						:disabled="noEditing()">
					<i class="fa-solid fa-chess-king fa-fw text-black shadow-white"></i>
				</button>
				<button type="button" class="btn btn-secondary px-2" title="All Neutral" @click="FEN.color(0)"
						:disabled="noEditing()">
					<i v-if="!store.board.blackWhite" class="fa-solid fa-chess-king fa-fw shadow-neutral" style="color:gray;"></i>
					<template v-else>
						<i class="fa-solid fa-chess-king fa-fw text-black shadow-white"></i><i
						   class="fa-solid fa-chess-king fa-fw text-white shadow-black"
						   style="margin-left:-1.25em; clip-path: polygon(51.5% 0, 100% 0, 100% 100%, 51.5% 100%);"></i>
					</template>
				</button>
				<button type="button" class="btn btn-secondary px-2" title="All White" @click="FEN.color(1)" :disabled="noEditing()">
					<i class="fa-solid fa-chess-king fa-fw text-white shadow-black"></i>
				</button>
			</span>
			<span class="btn-group">
				<button type="button" class="btn btn-secondary" title="Switch side" @click="FEN.invert(false)"
						:disabled="noEditing()">
					<i class="fa-solid fa-chess-king text-black shadow-white"></i>&ensp;<i
					   class="fa-solid fa-arrows-left-right"></i>&ensp;<i class="fa-solid fa-chess-king text-white shadow-black"></i>
				</button>
				<button type="button" class="btn btn-secondary" title="Switch case (including text)" @click="FEN.invert(true)"
						:disabled="noEditing()">
					A&ensp;<i class="fa-solid fa-arrows-left-right"></i>&ensp;a
				</button>
				<button v-if="!store.board.SN" type="button" class="btn btn-secondary"
						title="Change all S to N when 'Use S for knight' mode is off" @click="FEN.fixSN()" :disabled="noEditing()">
					S&ensp;<i class="fa-solid fa-arrow-right"></i>&ensp;N
				</button>
			</span>
		</div>

		<div class="text-end btn-gap">
			<span class="d-inline-block">
				<CopyButton v-if="store.feature.janko" :factory="API.copyJanko" class="btn-primary">Create Janko URL</CopyButton>
				<CopyButton v-if="status.envReady && !env.isTouch" :factory="() => copyImage(getBlob)" class="btn-primary">Copy image
				</CopyButton>
				<CopyButton :factory="API.copyUrl" class="btn-primary">Create image URL</CopyButton>
			</span>
			<span class="d-inline-block">
				<ShareButton />
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

<script setup lang="ts">
	import { store, state, status, noEditing } from "app/store";
	import { env } from "app/meta/env";
	import { API } from "app/tools/api";
	import { copyImage } from "app/interface/copy";
	import { getBlob } from "app/view/render";
	import CopyButton from "@/components/copyButton.vue";
	import { stopAnimation } from "app/view/animation";
	import { replace, createSnapshot, FEN } from "app/interface/squares";
	import { shift, mirror, rotate } from "app/meta/fen";
	import { setOption } from "app/interface/layout";
	import ShareButton from "./shareButton.vue";

	function shiftBy(dx: number, dy: number): void {
		stopAnimation(true);
		const { w, h } = store.board;
		replace(shift(createSnapshot(), dx, dy, w, h));
	}

	function mirrorBy(d: string): void {
		stopAnimation(true);
		const { w, h } = store.board;
		replace(mirror(createSnapshot(), d, w, h));
	}

	function rotateBy(d: number): void {
		stopAnimation(true);
		const { w, h } = store.board;
		if(w !== h) setOption({ w: h, h: w });
		replace(rotate(createSnapshot(), d, w, h));
	}

</script>
