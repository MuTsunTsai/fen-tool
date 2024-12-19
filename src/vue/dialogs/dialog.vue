<template>
	<div class="modal fade modal-second" ref="el">
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
				<div class="modal-body" v-html="message"></div>
				<div class="modal-footer">
					<slot></slot>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	let lastHidden: Promise<void> = Promise.resolve();
</script>

<script setup lang="ts">
	import Modal from "bootstrap/js/dist/modal";
	import { onMounted, shallowRef } from "vue";

	defineOptions({ name: "DialogModal" });

	let modal: Modal;
	const el = shallowRef<HTMLElement>();

	onMounted(() => {
		modal = new Modal(el.value!, { backdrop: "static" });
	});

	const message = shallowRef<string>("");

	async function show(msg: string, reset?: () => void): Promise<void> {
		const wait = lastHidden;
		let hidden: () => void | PromiseLike<void>;
		lastHidden = new Promise<void>(resolve => { hidden = resolve; });
		await wait;

		return new Promise<void>(resolve => {
			message.value = msg.replace(/\n/g, "<br>");
			el.value!.addEventListener("hide.bs.modal", () => {
				resolve();
			}, { once: true });
			el.value!.addEventListener("hidden.bs.modal", hidden, { once: true });
			reset?.();
			modal.show();
		});
	}

	defineExpose({
		show,
		hide: () => modal.hide(),
	});

</script>
