<template>
	<div class="text-center">
		<div class="d-inline-block" style="overflow: hidden;">
			<div id="Zone" class="d-inline-flex justify-content-center text-center collapse flex-wrap-reverse">
				<div id="EditZone" class="flex-grow-0 pb-4">
					<div class="d-inline-block position-relative">
						<canvas id="SN"></canvas>
						<div id="Squares">
							<div class="play-mask" v-show="noEditing()"></div>
						</div>
					</div>
				</div>
				<div id="DragZone" class="flex-grow-0 pb-4">
					<div class="position-relative d-inline-block" style="line-height: 0;">
						<canvas id="CN"></canvas>
						<div class="loader" :class="{ show: status.loading }">
							<div class="h-100 d-flex align-items-center justify-content-center">
								<i class="display-1 fa-solid fa-spinner fa-spin"></i>
							</div>
						</div>
						<img id="PV">
					</div>
					<canvas id="TP" class="ms-4" v-show="!hideTemplate()"></canvas>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { state, status, noEditing } from '../js/store';

	function hideTemplate() {
		return status.hor && state.popeye.playing;
	}
</script>