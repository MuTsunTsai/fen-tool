
import { defineConfig } from "@rsbuild/core";
import { pluginVue } from "@rsbuild/plugin-vue";
import { pluginCheckSyntax } from "@rsbuild/plugin-check-syntax";
import { pluginAssetsRetry } from "@rsbuild/plugin-assets-retry";
import { InjectManifest } from "@aaroon/workbox-rspack-plugin";
import { pluginSass } from "@rsbuild/plugin-sass";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";
import postcssPresetEnv from "postcss-preset-env";
import { createDescendantRegExp, makeTest } from "@mutsuntsai/rsbuild-utils";

const isProduction = process.env.NODE_ENV === "production";
const useRsdoctor = false;
const inspectBuild = false;

export default defineConfig({
	dev: {
		progressBar: true,
	},
	resolve: {
		alias: {
			// This is needed, otherwise umd will be used, causing vue compiler to be bundled.
			"vue-slicksort$": "./node_modules/vue-slicksort/dist/vue-slicksort.esm.js",
		},
	},
	source: {
		include: [/yaml/, /chess\.js/],
		entry: {
			"index": "./src/app/main.ts",
			"api/index": "./src/api/api.ts",
			"gen/index": "./src/gen/gen.ts",
			"sdk": {
				import: "./src/app/api/sdk.ts",
				html: false,
			},
		},
		define: {
			// __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
			__VUE_I18N_LEGACY_API__: false,
		},
		tsconfigPath: "./src/app/tsconfig.json",
	},
	html: {
		template: ({ entryName }) => ({
			"index": "./build/index.html",
			"api/index": "./src/api/index.html",
			"gen/index": "./src/gen/index.html",
		})[entryName],
	},
	server: {
		port: 3000,
		base: "/fen-tool",
		publicDir: {
			name: "src/public",
			copyOnBuild: true,
		},
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp",
		},
	},
	performance: !isProduction ? undefined : {
		chunkSplit: {
			strategy: "custom",
			splitChunks: {
				cacheGroups: {
					vue: {
						test: createDescendantRegExp("vue"),
						name: "vue",
						chunks: "all",
					},
					chess: {
						test: makeTest(/chess\.js/, /[\\/]modules[\\/]chess[\\/]/),
						name: "chess",
						chunks: "async",
					},
					olive: {
						test: makeTest(/yaml/, /olive\.ts$/),
						name: "olive",
						chunks: "async",
					},
				},
			},
		},
		preload: {
			type: "all-chunks",
			include: [/\.css$/],
		},
	},
	output: {
		cleanDistPath: isProduction,
		filename: {
			js(pathData) {
				if(pathData.runtime == "sdk") return "../../sdk.js";
				return isProduction ? "[name].[contenthash:8].js" : "[name].js";
			},
		},
		copy: [
			{ from: "lib/stockfish", to: "modules/stockfish", globOptions: { ignore: ["**/*.md"] } },
			{ from: "src/public/manifest.json", to: "." },
			{ from: "x*/*.png", to: "assets", context: "src/public/assets" },
			// Only precache the two most common resolution; see https://tinyurl.com/7rxv5f97
			{ from: "src/public/assets/icon/icon-32.png", to: "assets/icon" },
			{ from: "src/public/assets/icon/icon-192.png", to: "assets/icon" },
		],
		dataUriLimit: 100,
		legalComments: inspectBuild ? "inline" : "none",
		polyfill: "off",
		minify: !inspectBuild,
		distPath: {
			root: "docs",
		},
	},
	plugins: [
		pluginSass({
			sassLoaderOptions: {
				sassOptions: {
					silenceDeprecations: ["mixed-decls", "color-functions", "import", "global-builtin"],
				},
			},
		}),
		pluginVue(),
		pluginCheckSyntax({
			ecmaVersion: 2019,
		}),
		pluginAssetsRetry({
			addQuery: true,
			max: 2,
			test: url => !url.includes("gtag"),
		}),
	],
	tools: {
		bundlerChain: (chain, { CHAIN_ID }) => {
			chain.module.rule(CHAIN_ID.RULE.SASS)
				.use("bootstrap-loader")
				.after(CHAIN_ID.USE.CSS)
				.loader("./lib/bootstrap/loader.mjs");
		},
		postcss: (_, { addPlugins }) => {
			/**
			 * For the moment, although LightingCSS claims to handle vendor prefixes,
			 * the functionality seems less complete than postcssPresetEnv.
			 * For example, `-webkit-text-decoration` is not handled by LightingCSS
			 * (see https://caniuse.com/text-decoration).
			 */
			addPlugins(postcssPresetEnv());
		},
		rspack: (_, { appendPlugins, isDev }) => {
			if(isDev) return;

			if(useRsdoctor) {
				appendPlugins(new RsdoctorRspackPlugin({
					linter: {
						rules: { "ecma-version-check": "off" },
					},
					supports: {
						generateTileGraph: true,
					},
				}));
			}

			appendPlugins(new InjectManifest({
				swSrc: "./src/service/sw.js",
				exclude: [/\.ttf$/, /stockfish/],
			}));
		},
	},
});
