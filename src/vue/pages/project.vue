<template>
	<section :class="{ show: state.tab == 8 }">
		<input type="file" class="d-none" id="project_file" @change="open($event.target)" accept=".fentool,.olv">
		<div class="btn-gap">
			<div class="btn-group">
				<button type="button" class="btn btn-primary pe-2" @click="Project.add()">
					<i class="fa-solid fa-plus"></i>&ensp;Add
				</button>
				<button type="button" class="ps-2 btn btn-primary dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown"
						aria-haspopup="true" aria-expanded="false">
					<span class="visually-hidden">Toggle Dropdown</span>
				</button>
				<div class="dropdown-menu">
					<div class="dropdown-item" @click="Project.add(true)">As a Popeye problem</div>
				</div>
			</div>

			<label for="project_file" class="btn btn-secondary" title="Open a project file">
				<i class="fa-regular fa-folder-open"></i>&ensp;Open
			</label>
			<a :href="status.envReady ? Project.link.value : undefined" download="project.fentool" class="btn btn-secondary"
			   title="Save project file">
				<i class="fa-solid fa-download"></i>&ensp;Save
			</a>
			<button class="btn btn-secondary" @click="Project.reset()" title="Clear all positions in the project">
				<i class="fa-regular fa-file"></i>&ensp;Clear
			</button>
		</div>
		<div @mousedown.stop v-if="status.envReady" class="mt-3">
			<div v-if="!store.project.length" class="p-1">
				<div class="d-flex flex-wrap">
					<div style="flex-basis: max-content;">
						No positions in the project yet.&nbsp;
					</div>
					<div style="flex-basis: max-content;">
						Click "Add" to add position.
					</div>
				</div>
			</div>
			<SlickList axis="xy" v-model:list="store.project" :distance="env.isTouch ? 0 : 10" class="thumbnail-container"
					   :class="{ sorting: sorting }" @sort-start="sorting = true" @sort-end="sorting = false"
					   :press-delay="env.isTouch ? 200 : 0" helper-class="thumbnail-ghost">
				<SlickItem v-for="(item, i) of store.project" :index="i" :key="item.id">
					<div class="thumbnail-wrapper" :class="{ touch: env.isTouch }" @dragstart.prevent>
						<img :fen="getFen(item)" @click="set(item)" class="thumbnail" :class="{ disabled: noEditing() }">
						<i class="fa-solid fa-circle-xmark text-danger" @click="Project.remove(i)"></i>
					</div>
				</SlickItem>
			</SlickList>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { SlickList, SlickItem } from "vue-slicksort";
	import { shallowRef } from "vue";

	import { store, state, status, noEditing } from "app/store";
	import { env } from "app/meta/env";
	import { Project } from "app/tools/project/project";
	import { setFEN } from "app/interface/squares";
	import { toNormalFEN } from "app/meta/popeye/popeye";

	import type { ProjectEntry } from "app/tools/project/entry";

	const sorting = shallowRef(false);

	function set(item: ProjectEntry): void {
		if(noEditing()) return;
		setFEN(getFen(item));
		if(item.popeye) {
			state.tab = 7;
			state.compute = "py";
			state.popeye.input = item.popeye;
		}
		if(env.isTouch) {
			document.body.scrollTo({ behavior: "smooth", top: 0 });
		}
	}

	function open(target: EventTarget | null): void {
		const el = target as HTMLInputElement;
		const file = el.files?.[0];
		if(!file) return;
		el.value = "";
		Project.open(file);
	}

	function getFen(item: ProjectEntry): string {
		if(item.popeye?.includes("Forsyth")) return toNormalFEN(item.fen);
		return item.fen;
	}
</script>
