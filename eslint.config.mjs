import { defineConfig } from "eslint/config";
import pluginMocha from "eslint-plugin-mocha";
import { createConfig } from "@mutsuntsai/eslint";

export default defineConfig([
	...createConfig({
		ignores: ["docs/**/*", "lib/**/*.js"],
		import: ["src/**/*.vue", "src/app/**/*.js", "**/*.ts", "eslint.config.mjs"],
		project: [
			"src/app",
			"src/api",
			"src/gen",
			"src/vue",
		],
		globals: {
			cjs: ["gulpfile.js"],
			esm: ["eslint.config.mjs", "test/mocha.env.mjs", "scripts/*.js"],
			browser: ["src/**"],
		},
		html: {
			"no-var": "off",
			"vars-on-top": "off",
		},
	}),

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Tests
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	{
		...pluginMocha.configs.recommended,
		files: ["test/**"],
	},
	{
		files: ["test/**"],
		rules: {
			"mocha/prefer-arrow-callback": "warn",
			"mocha/no-exports": "off",
			"mocha/no-skipped-tests": "off",
		},
	},
	{
		files: ["{test,e2e}/**"],
		rules: {
			"@typescript-eslint/explicit-function-return-type": ["warn", {
				allowFunctionsWithoutTypeParameters: true,
			}],
			"@typescript-eslint/no-invalid-this": "off",
			"@typescript-eslint/no-magic-numbers": "off",
			"@typescript-eslint/no-unused-expressions": "off",
			"max-classes-per-file": "off",
			"max-lines-per-function": "off",
			"prefer-arrow-callback": "off",
		},
	},

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
