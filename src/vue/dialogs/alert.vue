<template>
	<Dialog ref="dialog">
		<button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
	</Dialog>
</template>

<script setup lang="ts">
	import { onMounted, shallowRef } from "vue";

	import { alert } from "app/meta/dialogs";
	import Dialog from "./dialog.vue";

	defineOptions({ name: "Alert" });

	const dialog = shallowRef<InstanceType<typeof Dialog>>();

	function show(msg: string): Promise<void> {
		return dialog.value!.show(msg);
	}

	onMounted(() => alert.setup(show));

	defineExpose({ show });
</script>
