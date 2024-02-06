<template>
	<div style="display: contents;">
		<main class="d-flex justify-content-center p-3">
			<div class="flex-grow-0 text-start" style="max-width: 100%;">
				<FenHeader />
				<Zone />
				<div v-cloak class="w-passive-100">
					<Menu />
					<div class="d-flex mb-4">
						<Edit />
						<Project />
						<Options />
						<Api />
						<Database />
						<Play />
						<Compute />
						<BBS />
					</div>
				</div>

				<hr>
				<AppFooter />
			</div>
		</main>
		<iframe v-if="state.split" src="."></iframe>
	</div>
</template>

<script setup>
	import { state } from '../js/store';

	import Menu from "./menu.vue";
	import Edit from "./edit.vue";
	import FenHeader from "./header.vue";
	import Zone from "./zone.vue";
	import AppFooter from "./footer.vue";
	import Options from "./options.vue";
	import Play from "./play.vue";
	import Database from "./database.vue";
	import Project from "./project.vue";
	import BBS from "./bbs.vue";
	import Compute from "./compute/compute.vue";
	import Api from "./api.vue";
</script>