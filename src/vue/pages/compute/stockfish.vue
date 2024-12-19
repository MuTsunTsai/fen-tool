<template>
	<div v-show="state.compute == 'sf'">
		<div v-if="status.stockfish.status < StockfishStatus.needReload">
			<div class="mb-3">To use this feature, we need to download Stockfish modules first.</div>
			<button v-if="status.stockfish.status == StockfishStatus.notDownloaded" type="button" class="btn btn-primary"
					@click="Stockfish.download">
				<i class="fa-solid fa-download"></i>&ensp;Download now! (39.5MB)
			</button>
			<button v-else type="button" class="btn btn-primary" disabled>
				<i class="fa-solid fa-download"></i>&ensp;Downloading...&ensp;<i class="fa-solid fa-spinner fa-spin"></i>
			</button>
		</div>
		<div v-else-if="status.stockfish.status == StockfishStatus.needReload">
			<div class="mb-3">Download complete. Please restart FEN Tool.</div>
			<button type="button" class="btn btn-primary" onclick="location.reload()">
				<i class="fa-solid fa-rotate-right"></i>&ensp;Restart FEN Tool now
			</button>
		</div>
		<div v-else>
			<div class="row align-items-baseline" v-if="status.stockfish.running < StockfishRunning.running">
				<div class="col" style="flex-basis: 12rem;">
					<div class="row gx-3 mb-2">
						<label class="col-auto col-form-label">Depth:</label>
						<div class="col">
							<InputNumber v-model="store.Stockfish.depth" :min="1" title="Search depth" />
						</div>
					</div>
				</div>
				<div class="col" style="flex-basis: 11rem;">
					<div class="row gx-3 mb-2">
						<label class="col-auto col-form-label">Lines:</label>
						<div class="col">
							<InputNumber v-model="store.Stockfish.lines" :min="1" title="Number of lines to search" />
						</div>
					</div>
				</div>
				<div class="col mb-2" style="flex-basis: 10rem;">
					<Checkbox v-model="store.Stockfish.study" :disabled="store.Stockfish.lines <= 1">Study mode</Checkbox>
				</div>
			</div>

			<div class="btn-gap">
				<button v-if="!status.stockfish.running" type="button" class="btn btn-primary" @click="Stockfish.analyze">
					<i class="fa-solid fa-play"></i>&ensp;Analyze with Stockfish 16
				</button>
				<button v-else-if="status.stockfish.running == StockfishRunning.starting" disabled class="btn btn-primary">
					<i class="fa-solid fa-play"></i>&ensp;Initializing...
				</button>
				<button v-else type="button" class="btn btn-secondary" @click="Stockfish.stop">
					<i class="fa-solid fa-stop"></i>&ensp;Stop
				</button>
			</div>

			<div class="mt-3">
				<div v-if="state.stockfish.depth">
					<span>Depth: {{ state.stockfish.depth }}</span>
					<span v-if="status.stockfish.running == StockfishRunning.running">
						/{{ store.Stockfish.depth }} <i class="fa-solid fa-spinner fa-spin ms-2"></i>
					</span>
				</div>
				<div v-if="state.stockfish.mate">
					{{ (state.stockfish.mate || "")[0] }} has mate in {{ (state.stockfish.mate || "")[1] }}.
				</div>
				<div v-else-if="state.stockfish.score">
					Score: {{ state.stockfish.score }}
				</div>
				<div v-if="state.stockfish.header.length">
					Solution is unique against best defense up to:<br>
					{{ Stockfish.format(state.stockfish.header) }}<br>
					And then:
				</div>
				<table class="table">
					<tbody>
						<tr v-for="line in state.stockfish.lines.filter(l => l && l.moves.length)" :key="line.pgn">
							<td class="align-top">
								<div class="nowrap">{{ line.score }}</div>
								<div class="mt-2">
									<button type="button" class="btn btn-primary px-2 py-0 m-0" title="Play this line"
											@click="Stockfish.play(line)">
										<i class="fa-solid fa-play"></i>
									</button>
								</div>
							</td>
							<td class="align-top w-100" v-text="Stockfish.format(line.moves)"></td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { store, state, status } from "app/store";
	import { StockfishStatus, StockfishRunning } from "app/meta/enum";
	import { Stockfish } from "app/tools/stockfish";
	import Checkbox from "@/components/checkbox.vue";
	import InputNumber from "@/components/inputNumber.vue";
</script>
