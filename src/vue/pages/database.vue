<template>
	<section :class="{ show: state.tab == 2 }">
		<div class="row gx-3 mb-2 align-items-center">
			<label class="col-auto col-form-label">Use database: </label>
			<div class="col">
				<div class="form-check d-inline-block me-3">
					<input class="form-check-input" type="radio" :checked="store.DB.use == 'PDB'" @change="store.DB.use = 'PDB'"
						   name="DB" id="rPDB">
					<label class="form-check-label" for="rPDB">
						PDB
					</label>
				</div>
				<div class="form-check d-inline-block">
					<input class="form-check-input" type="radio" :checked="store.DB.use == 'YACPDB'" @change="store.DB.use = 'YACPDB'"
						   name="DB" id="rYACPDB">
					<label class="form-check-label" for="rYACPDB">
						YACPDB
					</label>
				</div>
			</div>
		</div>
		<div class="mb-3 btn-gap">
			<CopyButton :factory="DB.copyEdit" class="btn-primary">
				Copy board edit syntax
			</CopyButton>
			<CopyButton v-if="store.DB.use == 'YACPDB'" :factory="YACPDB.copyFEN" class="btn-secondary">
				Copy YACPDB FEN
			</CopyButton>
		</div>
		<div class="row gx-3 mb-3">
			<label class="col-auto col-form-label">Problem Id:</label>
			<div class="col">
				<input type="text" class="form-control" v-model="problemId" :readonly="noEditing() || undefined">
			</div>
			<div class="col-auto">
				<input type="button" class="btn btn-primary" value="Get FEN" @click="DB.fetch($event.target as HTMLButtonElement)" :disabled="noEditing()">
			</div>
		</div>
		<div class="row align-items-center flex-wrap">
			<div class="col-auto mb-2">
				<Checkbox v-model="store.DB.exact">Search exactly these pieces</Checkbox>
			</div>
			<div class="col text-end btn-gap" style="flex-basis: 24rem;">
				<CopyButton :factory="DB.copyQuery" class="btn-secondary">
					Copy search query
				</CopyButton>
				<button class="btn btn-primary nowrap" @click="DB.search">
					<i class="fa-solid fa-magnifying-glass"></i>&ensp;Search position
				</button>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { computed } from "vue";

	import { store, state, noEditing } from "app/store";
	import { YACPDB } from "app/tools/yacpdb";
	import { PDB, problemId } from "app/tools/pdb";
	import CopyButton from "@/components/copyButton.vue";
	import Checkbox from "@/components/checkbox.vue";

	const DB = computed(() => store.DB.use == "PDB" ? PDB : YACPDB);
</script>
