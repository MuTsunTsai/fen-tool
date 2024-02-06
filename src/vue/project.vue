<template>
	<section :class="{ show: state.tab == 8 }">
		<div class="btn-gap">
			<button class="btn btn-secondary">
				New project
			</button>
			<button class="btn btn-secondary">
				Open project
			</button>
			<button class="btn btn-secondary">
				Save project
			</button>
		</div>
		<div class="mt-3 thumbnail-container" v-if="status.envReady">
			<div v-for="(item, i) of store.project" :key="i" class="thumbnail-wrapper" :class="{ touch: env.isTouch }">
				<img :fen="item.fen" @click="setFEN(item.fen)" class="thumbnail">
				<i class="fa-solid fa-circle-xmark text-danger" @click="Project.remove(i)"></i>
			</div>
			<div class="thumbnail d-flex border align-items-center justify-content-center" title="Add current position"
				 @click="Project.add()">
				<div class="text-center">
					<i class="fa-solid fa-plus h1"></i>
					<div>Add position</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
	import { store, state, status } from '../js/store';
	import { env } from '../js/meta/env';
	import { Project } from "../js/project";
	import { setFEN } from '../js/squares';
</script>