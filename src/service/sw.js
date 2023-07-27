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

const netOnly = new strategies.NetworkOnly({
	fetchOptions: { cache: "reload" },
});

// Receive share data
// reference: https://web.dev/workbox-share-targets/
routing.registerRoute(
	"/fen-tool",
	async ({ event }) => {
		const formData = await event.request.formData();
		const fen = formData.get("fen");
		const image = formData.get("image");
		const params = [];
		if(fen) params.push("fen=" + encodeURIComponent(fen));
		if(image) {
			const url = URL.createObjectURL(new Blob([image]));
			params.push("image=" + encodeURIComponent(url));
		}
		params.join("&");
		return Response.redirect("/fen-tool" + (params.length > 0 ? "?" + params.join("&") : ""), 303);
	},
	"POST"
);

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
