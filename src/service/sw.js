import * as googleAnalytics from "workbox-google-analytics";
import * as precaching from "workbox-precaching";
import * as routing from "workbox-routing";
import * as strategies from "workbox-strategies";

// Activate Workbox GA
googleAnalytics.initialize();

// Default resources use StaleWhileRevalidate strategy
const defaultHandler = new strategies.StaleWhileRevalidate({ cacheName: "assets" });
routing.setDefaultHandler(defaultHandler);

// Activates workbox-precaching
const precacheController = new precaching.PrecacheController({ cacheName: "assets" });
precacheController.addToCacheList(self.__WB_MANIFEST);
const precacheRoute = new precaching.PrecacheRoute(precacheController, {
	ignoreURLParametersMatching: [/.*/],
	cleanURLs: false,
});
routing.registerRoute(precacheRoute);

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
			imageStore.set(++imageIndex, image)
			params.push("image=" + imageIndex);
		}
		const url = "/fen-tool" + (params.length > 0 ? "?" + params.join("&") : "");
		return Response.redirect(url, 303);
	},
	"POST"
);

routing.registerRoute(
	({ url }) => url.pathname.startsWith("/fen-tool/shareImage"),
	({ url }) => {
		const index = Number(url.searchParams.get("image"));
		const image = imageStore.get(index);
		imageStore.delete(index);
		console.log("sw response", image);

		// it's OK to use File object (which is a Blob) here
		return new Response(image);
	},
);

const netOnly = new strategies.NetworkOnly({
	fetchOptions: { cache: "reload" },
});

// Third-party requests
routing.registerRoute(({ url }) => url.host != "mutsuntsai.github.io", netOnly);

self.addEventListener("install", event => {
	self.skipWaiting();

	console.log("service worker installing");
	precacheController.install(event);
});

self.addEventListener("activate", event => {
	precacheController.activate(event);
});
