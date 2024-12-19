<template>
	<div v-show="state.compute == 'sy'">
		<div class="mb-3">
			<button v-if="!status.syzygy.running" type="button" class="btn btn-primary" @click="Syzygy.run">
				<i class="fa-solid fa-play"></i>&ensp;Analyze with Syzygy tablebase
			</button>
			<button v-else class="btn btn-secondary me-3" @click="Syzygy.stop">
				<i class="fa-solid fa-stop"></i>&ensp;Stop
			</button>
		</div>
		<div v-if="state.syzygy.header" v-html="state.syzygy.header"></div>
		<table v-if="state.syzygy.lines" class="mt-3 table">
			<tr v-for="l in state.syzygy.lines" :key="l.pgn">
				<td class="align-top py-1">
					<button v-if="l.leaf" type="button" class="btn btn-primary px-2 py-0 m-0" title="Play this line"
							@click="Syzygy.play(l)">
						<i class="fa-solid fa-play"></i>
					</button>
				</td>
				<td class="align-top w-100 py-1" :style="`padding-left:${l.indent + .5}rem`">
					{{ Syzygy.format(l) }}
					<i v-if="l.searching" class="fa-solid fa-spinner fa-spin ms-2"></i>
				</td>
			</tr>
		</table>
	</div>
</template>

<script setup lang="ts">
	import { state, status } from "app/store";
	import { Syzygy } from "app/tools/syzygy";
</script>
