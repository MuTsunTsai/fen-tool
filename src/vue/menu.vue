<template>
	<div class="mb-3 nav-container" :class="{ 'mt-n3': hideTemplate() }">
		<ul class="nav nav-tabs pe-1" style="flex-wrap: nowrap;">
			<li class="nav-item">
				<div class="nav-link" :class="{ active: state.tab == 0 }" @click="state.tab = 0" title="Edit">
					<span class="d-sm-none"><i class="fa-solid fa-pen-to-square"></i></span>
					<span class="d-none d-sm-inline">Edit</span>
				</div>
			</li>
			<li class="nav-item">
				<div class="nav-link" :class="{ active: state.tab == 8 }" @click="state.tab = 8" title="Project">
					<span class="d-sm-none"><i class="fa-solid fa-chess-board"></i></span>
					<span class="d-none d-sm-inline">Project</span>
				</div>
			</li>
			<li class="nav-item">
				<div class="nav-link" :class="{ active: state.tab == 1 }" @click="state.tab = 1" title="Options">
					<span class="d-sm-none"><i class="fa-solid fa-calculator"></i></span>
					<span class="d-none d-sm-inline">Options</span>
				</div>
			</li>
			<li class="nav-item">
				<div class="nav-link" :class="{ active: state.tab == 7 }" @click="state.tab = 7" title="Compute">
					<span class="d-sm-none"><i class="fa-solid fa-gear"></i></span>
					<span class="d-none d-sm-inline">Compute</span>
				</div>
			</li>
			<li class="nav-item">
				<div class="nav-link" :class="{ active: state.tab == 6 }" @click="state.tab = 6" title="Play">
					<span class="d-sm-none"><i class="fa-solid fa-gamepad"></i></span>
					<span class="d-none d-sm-inline">Play</span>
				</div>
			</li>
			<li class="nav-item">
				<div class="nav-link" :class="{ active: state.tab == 2 }" @click="state.tab = 2" title="Database">
					<span class="d-sm-none"><i class="fa-solid fa-database"></i></span>
					<span class="d-none d-sm-inline">DB</span>
				</div>
			</li>
			<template v-if="status.envReady">
				<li class="nav-item" v-if="env.isTaiwan">
					<div class="nav-link" :class="{ active: state.tab == 4 }" @click="state.tab = 4" title="BBS">
						<span class="d-sm-none"><i class="fa-solid fa-terminal"></i></span>
						<span class="d-none d-sm-inline">BBS</span>
					</div>
				</li>
			</template>
			<li class="nav-item">
				<div class="nav-link" :class="{ active: state.tab == 5 }" @click="state.tab = 5" title="API">
					<span class="d-sm-none"><i class="fa-solid fa-share-from-square"></i></span>
					<span class="d-none d-sm-inline">API</span>
				</div>
			</li>
		</ul>
	</div>
</template>

<script setup>
	import { state, status } from '../js/store';
	import { env } from '../js/meta/env';

	function hideTemplate() {
		return status.hor && state.popeye.playing;
	}
</script>