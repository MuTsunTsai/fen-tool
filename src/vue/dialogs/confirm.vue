<template>
	<Dialog ref="dialog">
		<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">No</button>
		<button type="button" class="btn btn-primary" @click="yes">Yes</button>
	</Dialog>
</template>

<script setup lang="ts">
	import { onMounted, shallowRef } from "vue";

	import { confirm } from "app/meta/dialogs";
	import Dialog from "./dialog.vue";

	defineOptions({ name: "Confirm" });

	let value: boolean = false;
	const dialog = shallowRef<InstanceType<typeof Dialog>>();

	async function show(msg: string): Promise<boolean> {
		await dialog.value!.show(msg, () => value = false);
		return value;
	}

	function yes(): void {
		value = true;
		dialog.value!.hide();
	}

	onMounted(() => confirm.setup(show));

	defineExpose({ show });
</script>
