import * as precaching from "workbox-precaching";
import * as routing from "workbox-routing";
import * as strategies from "workbox-strategies";

const HTTP_SEE_OTHER = 303;

self.__WB_DISABLE_DEV_LOGS = true;

// COOP-COEP headers, for multi-thread wasm
// https://github.com/GoogleChrome/workbox/issues/2963
const headersPlugin = {
	handlerWillRespond: ({ response }) => {
		const headers = new Headers(response.headers);
		headers.set("Cross-Origin-Embedder-Policy", "require-corp");
		headers.set("Cross-Origin-Opener-Policy", "same-origin");

		return Promise.resolve(new Response(response.body, {
			headers,
			status: response.status,
			statusText: response.statusText,
		}));
	},
};

// Default resources use StaleWhileRevalidate strategy
// Need to store in a different cache, as precache could get cleaned-up on update
const defaultHandler = new strategies.StaleWhileRevalidate({ cacheName: "modules", plugins: [headersPlugin] });
routing.setDefaultHandler(defaultHandler);

// Activates workbox-precaching
const precacheController = new precaching.PrecacheController({ cacheName: "assets", plugins: [headersPlugin] });
precacheController.addToCacheList(self.__WB_MANIFEST);
const precacheRoute = new precaching.PrecacheRoute(precacheController, {
	ignoreURLParametersMatching: [/.*/],
	cleanURLs: false,
});
routing.registerRoute(precacheRoute);

// Since URL.createObjectURL doesn't work with service worker,
// we need to implement our own image store and route.
const imageStore = new Map();
let imageIndex = 0;

// Receive share data
// reference: https://web.dev/workbox-share-targets/
routing.registerRoute(
	({ url }) => url.pathname.startsWith("/fen-tool/share"),
	async ({ event }) => {
		const formData = await event.request.formData();
		const fen = formData.get("fen");
		const image = formData.get("image"); // a File object
		const params = [];
		if(fen) params.push("fen=" + encodeURIComponent(fen));
		if(image) {
			imageStore.set(++imageIndex, image);
			params.push("image=" + imageIndex);
		}
		const url = "/fen-tool" + (params.length > 0 ? "?" + params.join("&") : "");
		return Response.redirect(url, HTTP_SEE_OTHER);
	},
	"POST"
);

// Route for getting the image
routing.registerRoute(
	({ url }) => url.pathname.startsWith("/fen-tool/shareImage"),
	({ url }) => {
		const index = Number(url.searchParams.get("image"));
		const image = imageStore.get(index);
		imageStore.delete(index);

		// it's OK to use File object (which is a Blob) here
		return new Response(image);
	}
);

const netOnly = new strategies.NetworkOnly({
	fetchOptions: { cache: "reload" },
});

// Third-party requests
routing.registerRoute(({ url }) => url.host != "mutsuntsai.github.io" && !url.host.startsWith("localhost"), netOnly);

self.addEventListener("install", event => {
	self.skipWaiting();

	console.log("service worker installing");
	precacheController.install(event);
});

self.addEventListener("activate", event => {
	precacheController.activate(event);
});
