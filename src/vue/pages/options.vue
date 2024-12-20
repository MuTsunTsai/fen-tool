<template>
	<section :class="{ show: state.tab == 1 }">
		<div class="row mb-2">
			<div class="col flex-grow-1" style="flex-basis: 18rem;">
				<div class="row gx-3">
					<div class="col" style="flex-basis: 15rem;">
						<div class="row gx-3 mb-2">
							<label class="col-auto col-form-label">Chess set:</label>
							<div class="col">
								<select class="form-select" v-model="Layout.set">
									<option value="1echecs">1Echecs</option>
									<option value="alpha">Alpha</option>
									<option value="goodCompanion">Good Companion</option>
									<option value="kilfiger">Kilfiger</option>
									<option value="merida">Merida</option>
									<option value="mpchess">MPChess</option>
									<option value="skak">Skak</option>
								</select>
							</div>
						</div>
					</div>
					<div class="col" style="flex-basis: 13rem;">
						<div class="row gx-3 mb-2">
							<label class="col-auto col-form-label">Square size:</label>
							<div class="col">
								<select class="form-select" v-model.number="Layout.size">
									<option value="26">26px</option>
									<option value="32">32px</option>
									<option value="38">38px</option>
									<option value="44">44px</option>
								</select>
							</div>
						</div>
					</div>
				</div>
				<Checkbox class="mb-2" v-model="store.board.exHigh" @change="drawExport">Export to high-resolution image
				</Checkbox>
				<div class="row gx-3">
					<div class="col" style="flex-basis: 15rem;">
						<div class="row gx-3 mb-2">
							<label class="col-auto col-form-label">Background:</label>
							<div class="col">
								<select class="form-select" v-model="store.board.bg" @change="updateBG">
									<option :value="undefined">Default</option>
									<option value="gray">Gray</option>
									<option value="green">Green</option>
									<option value="classic">Classic</option>
								</select>
							</div>
						</div>
					</div>
					<div class="col" style="flex-basis: 16rem;">
						<div class="row gx-3 mb-2">
							<label class="col-auto col-form-label">Board pattern:</label>
							<div class="col">
								<select class="form-select" v-model="store.board.pattern" @change="updateBG">
									<option :value="undefined">Normal</option>
									<option value="inverted">Inverted</option>
									<option value="mono">Uncolored</option>
								</select>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="col flex-grow-1 mb-2" style="flex-basis: 22rem;">
				<div class="row gx-3">
					<div class="col" style="flex-basis: 22rem;">
						<div class="row gx-3">
							<div class="col mb-2" style="flex-basis: 14rem; flex-grow: 10000;">
								<div class="row gx-3">
									<div class="col">
										<InputNumber v-model="Layout.width" :min="1" title="Files" />
									</div>
									<label class="col-auto col-form-label">x</label>
									<div class="col">
										<InputNumber v-model="Layout.height" :min="1" title="Ranks" />
									</div>
								</div>
							</div>
							<div class="col mb-2 text-end">
								<button type="button" class="btn btn-secondary"
										@click="Layout.setDimension({ w: 8, h: 8 })">Reset</button>
							</div>
						</div>
					</div>
					<div class="col" style="flex-basis: 14rem;">
						<div class="row gx-3 mb-2">
							<label class="col-auto col-form-label">Border pattern:</label>
							<div class="col">
								<input type="text" placeholder="Use comma-separated numbers" title="Use comma-separated numbers"
									   class="form-control" :value="store.board.border"
									   @change="Layout.setBorder($event.target as HTMLInputElement)">
							</div>
						</div>
					</div>
				</div>
				<Checkbox v-model="store.board.SN" @change="updateSN">Use S for knight</Checkbox>
				<div class="row gx-3 align-items-baseline">
					<div class="col" style="flex-basis: 15rem;">
						<Checkbox v-model="store.board.blackWhite" @change="redraw">Black/White neutral piece</Checkbox>
					</div>
					<div class="col" style="flex-basis: 15rem;" v-show="ready && store.board.blackWhite">
						<div class="row align-items-center">
							<label class="col-auto col-form-label">Knight offset:</label>
							<div class="col">
								<input type="range" class="form-range" min="0.25" max="0.75" step="0.025"
									   v-model.number="store.board.knightOffset" @input="redraw">
							</div>
						</div>
					</div>
				</div>
				<div class="d-none d-md-block">
					<Checkbox v-model="store.board.collapse" @change="resize">Always collapse boards</Checkbox>
				</div>
				<Checkbox v-model="store.board.coordinates" @change="toggleCoordinates">Show coordinate labels</Checkbox>
				<Checkbox v-model="store.board.fullFEN" @change="toFEN">Show full FEN</Checkbox>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { onMounted, shallowRef } from "vue";

	import { store, state } from "app/store";
	import { redraw, updateBG, drawExport } from "app/view/render";
	import { resize, setOption, Layout } from "app/interface/layout";
	import { toFEN, updateSN } from "app/interface/squares";
	import Checkbox from "@/components/checkbox.vue";
	import InputNumber from "@/components/inputNumber.vue";

	const ready = shallowRef(false);
	const TIMEOUT = 50;
	onMounted(() => setTimeout(() => ready.value = true, TIMEOUT));

	function toggleCoordinates(): void {
		setOption({}, true);
	}
</script>
