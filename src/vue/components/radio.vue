<template>
	<span class="me-3">{{ label }}</span>
	<div v-for="(t, i) in text" class="form-check d-inline-block me-3" :key="i">
		<input class="form-check-input" type="radio" :checked="checked(i)" :disabled="disabled" @change="set(i)" :name="id"
			   :id="id + '_' + i">
		<label class="form-check-label" :for="id + '_' + i" v-text="t"></label>
	</div>
</template>

<script setup lang="ts">
	import { getCurrentInstance } from "vue";

	const props = defineProps<{
		label: string;
		text: string[];
		value: unknown[];
		modelValue: unknown;
		disabled?: boolean;
	}>();
	const emit = defineEmits(["update:modelValue"]);

	const id = "rdo" + getCurrentInstance()!.uid;

	function checked(i: number): boolean {
		return props.modelValue === props.value[i];
	}

	function set(i: number): void {
		emit("update:modelValue", props.value[i]);
	}
</script>
