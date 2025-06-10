import { defineConfig } from "eslint/config";
import { createConfig } from "@mutsuntsai/eslint";

export default defineConfig([
	...createConfig({
		ignores: ["docs/**/*", "lib/**/*.js"],
		import: {
			files: ["src/**/*.vue", "src/app/**/*.js", "**/*.ts", "./*.js"],
			project: [
				"src/app",
				"src/api",
				"src/gen",
				"src/vue",
			],
		},
		globals: {
			esm: ["./*.{js,ts}", "test/mocha.env.js", "scripts/*.js"],
			browser: ["src/**"],
		},
		html: {
			"no-var": "off",
			"vars-on-top": "off",
		},
		mocha: ["test/**"],
		playwright: ["e2e/**"],
	}),

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Specific scopes
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	{
		files: ["src/app/**/*.js"],
		languageOptions: {
			globals: {
				gtag: true,
				isHttps: true,
			},
		},
	},
	{
		files: ["src/**/*.{ts,vue}"],
		rules: {
			"@typescript-eslint/explicit-function-return-type": ["warn", {
				allowExpressions: true,
			}],
		},
	},
]);
