<template>
	<section :class="{ show: state.tab == 5 }">
		<div class="mb-2 btn-gap">
			<CopyButton :factory="API.copyBase64" class="btn-secondary" :disabled="local">
				Copy base64 link
			</CopyButton>
			<CopyButton :factory="API.copyBase64Img" class="btn-secondary" :disabled="local">
				Copy base64 &lt;img&gt; code
			</CopyButton>
		</div>
		<h6>Embed mode</h6>
		<div class="mb-2 btn-gap">
			<CopyButton :factory="API.copyEmbed" class="btn-secondary">
				Copy embed HTML code
			</CopyButton>
			<CopyButton :factory="API.copyEmbedUrl" class="btn-secondary">
				Copy just the URL
			</CopyButton>
		</div>
		<h6>SDK mode</h6>
		<div class="btn-gap">
			<CopyButton :factory="API.copySDK" class="btn-secondary">
				Copy SDK script tag
			</CopyButton>
			<CopyButton :factory="API.copyImg" class="btn-secondary">
				Copy SDK &lt;img&gt; code
			</CopyButton>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { state } from "app/store";
	import { API } from "app/tools/api";
	import CopyButton from "@/components/copyButton.vue";

	const local = !location.protocol.startsWith("http");
</script>
