<template>
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
</template>

<script setup lang="ts">
	import Edit from "./edit/edit.vue";
	import Options from "./options.vue";
	import Play from "./play.vue";
	import Database from "./database.vue";
	import Project from "./project.vue";
	import BBS from "./bbs.vue";
	import Compute from "./compute/compute.vue";
	import Api from "./api.vue";
</script>
