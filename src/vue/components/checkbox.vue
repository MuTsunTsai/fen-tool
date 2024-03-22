<template>
	<div class="form-check">
		<input type="checkbox" class="form-check-input" :id="id" :checked="modelValue"
			   @change="$emit('update:modelValue', !modelValue); $emit('change')" :disabled="disabled">
		<label class="form-check-label" :for="id">
			<slot></slot>
		</label>
	</div>
</template>

<script setup lang="ts">
	import { getCurrentInstance } from "vue";

	defineProps<{
		modelValue: boolean;
		disabled?: boolean;
	}>();
	defineEmits(["update:modelValue", "change"]);

	const id = "chk" + getCurrentInstance()!.uid;
</script>
