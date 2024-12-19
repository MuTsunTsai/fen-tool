<template>
	<li class="nav-item">
		<div class="nav-link" :class="{ active: state.tab == index }" @click="state.tab = index" :title="title">
			<span class="d-sm-none"><i :class="icon"></i></span>
			<span class="d-none d-sm-inline">
				<slot></slot>
			</span>
		</div>
	</li>
</template>

<script setup lang="ts">
	import { state } from "app/store";

	defineProps<{
		index: number;
		icon: string;
		title: string;
	}>();
</script>
