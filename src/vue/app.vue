<template>
	<div style="display: contents;">
		<main class="d-flex justify-content-center p-3">
			<div class="flex-grow-0 text-start" style="max-width: 100%;">
				<FenHeader />
				<Zone />
				<div v-cloak class="w-passive-100">
					<Menu />
					<Sections />
				</div>
				<hr>
				<AppFooter />
			</div>
		</main>
		<Alert />
		<Confirm />
		<iframe v-if="state.split" src="."></iframe>
	</div>
</template>

<script setup lang="ts">
	import { state } from "app/store";
	import Alert from "./dialogs/alert.vue";
	import Confirm from "./dialogs/confirm.vue";
	import Menu from "./menu.vue";
	import Sections from "./pages/sections.vue";
	import FenHeader from "./header.vue";
	import Zone from "./zone.vue";
	import AppFooter from "./footer.vue";
</script>
