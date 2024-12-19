<template>
	<section :class="{ show: state.tab == 6 }">

		<div v-if="state.play.playing">
			<div class="mb-3">
				<span class="btn-gap">
					<button type="button" class="py-0 btn btn-secondary" @click="PLAY.move(-1)" :disabled="isMin()">
						<i class="fa-solid fa-angles-left fa-fw"></i>
					</button>
					<button type="button" class="py-0 btn btn-secondary" @click="PLAY.moveBy(-1)" :disabled="isMin()">
						<i class="fa-solid fa-angle-left fa-fw"></i>
					</button>
					<button type="button" class="py-0 btn btn-secondary" @click="PLAY.moveBy(1)" :disabled="isMax()">
						<i class="fa-solid fa-angle-right fa-fw"></i>
					</button>
					<button type="button" class="py-0 btn btn-secondary" @click="PLAY.move(state.play.history.length - 1)"
							:disabled="isMax()">
						<i class="fa-solid fa-angles-right fa-fw"></i>
					</button>
				</span>
				<span>
					<span class="btn step px-1 py-0 ms-3" @click="PLAY.goto()"
						  :class="{ active: -1 == state.play.moveNumber }">*</span>
				</span>
				<span class="btn-gap" v-if="status.module.chess">
					<span v-for="(h, i) in state.play.history" :key="i">
						<span v-if="state.play.history[i - 1] && state.play.history[i - 1].color == h.color">
							<span v-if="h.color == Color.white"> ... </span>
							<span v-else>{{ PLAY.number(h) }}...</span>
						</span>
						<span v-if="h.color == Color.black && i == 0" class="ms-2">{{ PLAY.number(h) }}...</span>
						<span v-if="h.color == Color.white" class="ms-2">{{ PLAY.number(h) }}.</span>
						<span class="btn step px-1 py-0" @click="PLAY.move(i)" :class="{ active: i == state.play.moveNumber }">{{
							PLAY.format(h) }}</span>
					</span>
					<template v-if="state.play.mode != PlayMode.retro">
						<span v-if="state.play.over == overState.checkmate">Checkmate.</span>
						<span v-if="state.play.over == overState.draw">Draw.</span>
					</template>
				</span>
			</div>
			<div class="btn-gap">
				<button class="btn btn-secondary" @click="PLAY.exit">
					Exit playing
				</button>
				<CopyButton :factory="PLAY.copyGame" class="btn-primary">
					Copy game
				</CopyButton>
				<CopyButton :factory="PLAY.copyPGN" class="btn-primary">
					Copy PGN
				</CopyButton>
				<button v-if="env.canPaste" class="btn btn-secondary" @click="PLAY.pasteMoves">
					<i class="fa-solid fa-paste"></i> Paste moves
				</button>
			</div>
			<div class="mt-2">
				<span class="me-3">Symbol:</span>
				<div class="form-check d-inline-block me-3">
					<input class="form-check-input" type="radio" :checked="store.PLAY.symbol == null"
						   @change="store.PLAY.symbol = null" name="SYM" id="sEng">
					<label class="form-check-label" for="sEng">
						English
					</label>
				</div>
				<div class="form-check d-inline-block me-3">
					<input class="form-check-input" type="radio" :checked="store.PLAY.symbol == 'german'"
						   @change="store.PLAY.symbol = 'german'" name="SYM" id="sGer">
					<label class="form-check-label" for="sGer">
						German
					</label>
				</div>
				<div class="form-check d-inline-block">
					<input class="form-check-input" type="radio" :checked="store.PLAY.symbol == 'unicode'"
						   @change="store.PLAY.symbol = 'unicode'" name="SYM" id="sUni">
					<label class="form-check-label" for="sUni">
						Unicode
					</label>
				</div>
			</div>
			<div class="mt-2" v-if="!isRetro()">
				<Checkbox v-model="store.PLAY.ep">Add ep to en passant moves</Checkbox>
			</div>
			<div class="mt-2">
				<Checkbox v-model="store.PLAY.zero">Use number 0 for castling notation</Checkbox>
			</div>
			<div class="mt-2" v-if="isRetro()">
				<Checkbox v-model="store.PLAY.negative">Use negative numbers in retro mode</Checkbox>
			</div>
		</div>

		<template v-else>
			<div class="btn-gap">
				<button class="btn btn-primary" @click="PLAY.start" :disabled="state.popeye.playing">Start
					playing</button>
				<button type="button" class="btn btn-secondary" @click="FEN.reset(true)" :disabled="state.popeye.playing">
					<i class="fa-solid fa-flag-checkered"></i> &ensp;Starting position
				</button>
				<button class="btn btn-secondary" @click="PLAY.pasteGame" :disabled="state.popeye.playing">
					<i class="fa-solid fa-paste"></i> Paste PGN
				</button>
			</div>
			<div class="mt-2 gx-3 row">
				<div class="col flex-grow-1" style="flex-basis: 22rem;">
					<div class="d-flex align-items-center flex-wrap-reverse mb-2">
						<div class="flex-grow-1 col-form-label" style="flex-basis: max-content;">
							<Radio v-model="state.play.turn" label="Turn:" :text="['White', 'Black']" :value="['w', 'b']"
								   :disabled="state.play.mode == PlayMode.pass" />
						</div>
						<div class="flex-grow-1" style="flex-basis: max-content;">
							<div class="row gx-3">
								<label class="col-auto col-form-label">Mode:</label>
								<div class="col">
									<select class="form-select" v-model="state.play.mode" @change="updateBG">
										<option value="normal">Normal</option>
										<option value="pass">Allow passing move</option>
										<option value="retro">Retro</option>
									</select>
								</div>
							</div>
						</div>
					</div>
					<div class="mb-2">
						Castling:
						<span class="d-inline-block">
							<Checkbox class="ms-2 d-inline-block" v-model="state.play.castle.K" :disabled="isRetro()">WK</Checkbox>
							<Checkbox class="ms-2 d-inline-block" v-model="state.play.castle.Q" :disabled="isRetro()">WQ</Checkbox>
						</span>
						<span class="d-inline-block">
							<Checkbox class="ms-2 d-inline-block" v-model="state.play.castle.k" :disabled="isRetro()">BK</Checkbox>
							<Checkbox class="ms-2 d-inline-block" v-model="state.play.castle.q" :disabled="isRetro()">BQ</Checkbox>
						</span>
					</div>
				</div>
				<div class="col flex-grow-1" style="flex-basis: 22rem;">
					<div class="row gx-3 mb-2">
						<label class="col-auto col-form-label">En passant square: </label>
						<div class="col">
							<input type="text" class="form-control" maxlength="2" v-model="state.play.enPassant"
								   :disabled="isRetro()">
						</div>
					</div>
					<div class="row gx-3">
						<div class="col mb-2" style="flex-basis: 10.5rem;">
							<div class="row gx-3">
								<label class="col-auto col-form-label">Half moves: </label>
								<div class="col">
									<input type="number" class="form-control" min="0" v-model.number="state.play.halfMove"
										   :disabled="isRetro()">
								</div>
							</div>
						</div>
						<div class="col mb-2" style="flex-basis: 10.5rem;">
							<div class="row gx-3">
								<label class="col-auto col-form-label">Full moves: </label>
								<div class="col">
									<input type="number" class="form-control" min="1" v-model.number="state.play.fullMove"
										   :disabled="isRetro()">
								</div>
							</div>
						</div>
					</div>
					<div class="text-end">
						<button class="btn btn-secondary" @click="resetEdwards">Reset settings</button>
					</div>
				</div>
			</div>
		</template>
	</section>
</template>

<script setup lang="ts">
	import { PLAY } from "app/tools/play/play";
	import { env } from "app/meta/env";
	import { state, status, store } from "app/store";
	import { updateBG } from "app/view/render";
	import CopyButton from "@/components/copyButton.vue";
	import Checkbox from "@/components/checkbox.vue";
	import Radio from "@/components/radio.vue";
	import { Color, PlayMode } from "app/meta/enum";
	import { FEN, resetEdwards } from "app/interface/squares";
	import { overState } from "app/modules/chess/types";

	const isRetro = (): boolean => state.play.mode == PlayMode.retro;

	const isMin = (): boolean => state.play.moveNumber < 0;
	const isMax = (): boolean => state.play.moveNumber >= state.play.history.length - 1;
</script>
