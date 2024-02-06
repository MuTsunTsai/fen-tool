<template>
	<section :class="{ show: state.tab == 8 }">
		<input type="file" class="d-none" id="project_file" @change="open($event.target)" accept=".fentool">
		<div class="btn-gap">
			<button class="btn btn-primary" @click="Project.add()">
				Add to project
			</button>
			<label for="project_file" class="btn btn-secondary">Open project</label>
			<a :href="status.envReady ? Project.link.value : undefined" download="project.fentool" class="btn btn-secondary">
				Save project
			</a>
			<button class="btn btn-secondary" @click="Project.reset()">
				New project
			</button>
		</div>
		<div @mousedown.stop v-if="status.envReady" class="mt-3">
			<div v-if="!store.project.length" class="p-1">No positions in the project yet.</div>
			<SlickList axis="xy" v-model:list="store.project" :distance="env.isTouch ? 0 : 10" class="thumbnail-container"
					   :class="{ sorting: sorting }" @sort-start="sorting = true" @sort-end="sorting = false"
					   :press-delay="env.isTouch ? 200 : 0" helper-class="thumbnail-ghost">
				<SlickItem v-for="(item, i) of store.project" :index="i" :key="item.id">
					<div class="thumbnail-wrapper" :class="{ touch: env.isTouch }" @dragstart.prevent>
						<img :fen="item.fen" @click="set(item.fen)" class="thumbnail" :class="{ disabled: noEditing() }">
						<i class="fa-solid fa-circle-xmark text-danger" @click="Project.remove(i)"></i>
					</div>
				</SlickItem>
			</SlickList>
		</div>
	</section>
</template>

<script setup>
	import { SlickList, SlickItem } from "vue-slicksort";
	import { shallowRef } from "vue";

	import { store, state, status, noEditing } from '../js/store';
	import { env } from '../js/meta/env';
	import { Project } from "../js/project";
	import { setFEN } from '../js/squares';

	const sorting = shallowRef(false);

	function set(fen) {
		if(noEditing()) return;
		setFEN(fen);
		if(env.isTouch) document.body.scrollTo({ behavior: "smooth", top: 0 });
	}

	function open(target) {
		const file = target.files[0];
		if(!file) return;
		target.value = "";
		Project.open(file);
	}
</script>