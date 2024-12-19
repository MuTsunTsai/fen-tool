import { PurgeCSS } from "purgecss";

const app = "./src/vue/";
const compare = [app + "**/*.vue"];

/**
 * Apply PurgeCSS to the bundled Bootstrap
 * @type {import("@rspack/core").LoaderDefinitionFunction}
 */
export default function(content, map, meta) {
	const callback = this.async();
	if(!this.resourcePath.match(/lib[\\/]bootstrap[\\/]bootstrap.scss$/)) {
		callback(null, content, map, meta);
		return;
	}

	this.addContextDependency(app);

	new PurgeCSS()
		.purge({
			content: compare,
			css: [{ raw: content }],
			safelist: {
				standard: [
					"text-danger",
					/backdrop/,
					/modal-static/,
				],
				variables: [
					"--bs-primary",
					/^--bs-btn-disabled/,
					/^--bs-nav-tabs/,
					/^--bs-gray-(6|8)00/,
				],
			},
			variables: true,
		})
		.then(result => {
			callback(null, result[0].css, undefined, meta);
		})
		.catch(err => callback(err));
};
