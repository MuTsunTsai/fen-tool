<template>
	<div class="input-group">
		<button class="btn btn-secondary px-2" :disabled="isMin()" type="button" @click="setBy(-1)">
			<i class="fa-solid fa-minus"></i>
		</button>
		<input type="number" class="form-control text-center px-0" min="1" :title="title" :value="props.modelValue"
			   @change="set($event)" onfocus="this.select()">
		<button class="btn btn-secondary px-2" :disabled="isMax()" type="button" @click="setBy(1)">
			<i class="fa-solid fa-plus"></i>
		</button>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps<{
		title: string;
		min: number;
		max?: number;
		modelValue: number;
	}>();
	const emit = defineEmits(["update:modelValue"]);

	function set(event: Event): void {
		const el = event.target as HTMLInputElement;
		const oldV = props.modelValue;
		const newV = Math.round(Number(el.value));
		if(isNaN(newV) || newV < props.min || props.max !== undefined && newV > props.max) {
			el.value = oldV.toString();
		} else {
			emit("update:modelValue", newV);
		}
	}

	function setBy(delta: number): void {
		emit("update:modelValue", props.modelValue + delta);
	}

	const isMin = (): boolean => props.modelValue <= props.min;
	const isMax = (): boolean => props.max !== undefined && props.modelValue >= props.max;
</script>
