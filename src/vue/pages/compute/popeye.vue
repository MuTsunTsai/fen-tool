<template>
	<div v-show="state.compute == 'py'">
		<div v-show="!state.popeye.playing && !state.popeye.editMap">
			<textarea class="form-control mb-2" rows="5" v-model="state.popeye.input" :disabled="state.popeye.running"
					  :placeholder="placeholder"></textarea>
			<div class="mb-3 row gx-2">
				<div class="col">
					<div class="w-passive-100">
						<button type="button" class="btn btn-secondary" @click="Popeye.editMap" :disabled="state.popeye.running"
								style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 100%;">
							<i class="fa-solid fa-pen-to-square"></i>&ensp;Fairy piece mapping
						</button>
					</div>
				</div>
				<div class="col-auto text-end">
					<div class="btn-gap">
						<button type="button" class="btn btn-secondary" @click="Popeye.play" :disabled="state.popeye.error"
								v-if="!state.popeye.running && state.popeye.output">
							Play solution
						</button>
						<span v-if="!state.popeye.running">
							<button type="button" class="btn btn-primary disabled"
									v-if="state.play.playing || !state.popeye.input.trim()"
									:title="state.play.playing ? 'Need to exit play mode first' : 'Input instructions first'">
								<i class="fa-solid fa-play"></i>&ensp;Run
							</button>
							<button type="button" class="btn btn-primary" @click="Popeye.run" v-else
									title="Run Popeye on your device!">
								<i class="fa-solid fa-play"></i>&ensp;Run
							</button>
						</span>
						<button v-else type="button" class="btn btn-secondary" @click="Popeye.cancel">
							<i class="fa-solid fa-stop"></i>&ensp;Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
		<div v-if="!state.popeye.playing && state.popeye.editMap">
			<textarea class="form-control mb-2" rows="5" v-model="state.popeye.mapping"
					  placeholder="Use the format like *2Q=G for each line."></textarea>
			<div class="mb-3 row">
				<div class="col">
					<div class="btn-gap">
						<button type="button" class="btn btn-primary" @click="Popeye.saveMap">
							Save setting
						</button>
						<button type="button" class="btn btn-secondary" @click="state.popeye.editMap = false">
							Cancel
						</button>
					</div>
				</div>
				<div class="col-auto text-end">
					<button type="button" class="btn btn-secondary" @click="Popeye.resetMap">
						Reset
					</button>
				</div>
			</div>
		</div>
		<div class="mb-3 row" v-if="state.popeye.playing">
			<div class="col">
				<div class="btn-gap">
					<button type="button" class="btn btn-secondary" @click="Popeye.move(0)" :disabled="state.popeye.index <= 0">
						<i class="fa-solid fa-angles-left fa-fw"></i>
					</button>
					<button type="button" class="btn btn-secondary" @click="Popeye.moveBy(-1)" :disabled="state.popeye.index <= 0">
						<i class="fa-solid fa-angle-left fa-fw"></i>
					</button>
					<button type="button" class="btn btn-secondary" @click="Popeye.moveBy(1)"
							:disabled="state.popeye.index >= state.popeye.steps.length - 1">
						<i class="fa-solid fa-angle-right fa-fw"></i>
					</button>
					<button type="button" class="btn btn-secondary" @click="Popeye.move(state.popeye.steps.length - 1)"
							:disabled="state.popeye.index >= state.popeye.steps.length - 1">
						<i class="fa-solid fa-angles-right fa-fw"></i>
					</button>
				</div>
			</div>
			<div class="col-auto text-end">
				<button type="button" class="btn btn-secondary" @click="Popeye.exit">
					Exit playing
				</button>
			</div>
		</div>
		<div id="Output" v-show="state.popeye.output && state.tab == 7" class="form-control" v-html="state.popeye.output"
			 @click="Popeye.step($event)">
		</div>
		<div class="mt-2">
			<a href="https://github.com/thomas-maeder/popeye/blob/master/py-engl.txt" target="_blank">
				Popeye documentation
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { state } from "app/store";
	import { Popeye } from "app/tools/popeye/popeye";

	const placeholder = "For example:\n=============\nStipulation #2\nOption Variation";
</script>
