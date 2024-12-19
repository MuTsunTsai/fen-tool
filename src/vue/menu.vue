<template>
	<div class="mb-3 nav-container" :class="{ 'mt-n3': hideTemplate() }">
		<ul class="nav nav-tabs pe-1" style="flex-wrap: nowrap;">
			<MenuTab :index="0" icon="fa-solid fa-pen-to-square" title="Edit">Edit</MenuTab>
			<MenuTab :index="8" icon="fa-solid fa-chess-board" title="Project">Project</MenuTab>
			<MenuTab :index="1" icon="fa-solid fa-gear" title="Options">Options</MenuTab>
			<MenuTab :index="7" icon="fa-solid fa-calculator" title="Compute">Compute</MenuTab>
			<MenuTab :index="6" icon="fa-solid fa-gamepad" title="Play">Play</MenuTab>
			<MenuTab :index="2" icon="fa-solid fa-database" title="Database">DB</MenuTab>
			<MenuTab :index="4" icon="fa-solid fa-terminal" title="BBS" v-if="status.envReady && env.isTaiwan">BBS</MenuTab>
			<MenuTab :index="5" icon="fa-solid fa-share-from-square" title="API">API</MenuTab>
		</ul>
	</div>
</template>

<script setup lang="ts">
	import { status, hideTemplate } from "app/store";
	import { env } from "app/meta/env";
	import MenuTab from "@/components/menuTab.vue";
</script>
