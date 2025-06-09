import { defineConfig } from "eslint/config";
import pluginMocha from "eslint-plugin-mocha";
import pluginPlaywright from "eslint-plugin-playwright";
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
			"max-classes-per-file": "off",
			"max-lines-per-function": "off",
			"prefer-arrow-callback": "off",
		},
	},
	{
		files: ["{test,e2e}/**/*.ts"],
		rules: {
			"@typescript-eslint/explicit-function-return-type": ["warn", {
				allowFunctionsWithoutTypeParameters: true,
			}],
			"@typescript-eslint/no-invalid-this": "off",
			"@typescript-eslint/no-magic-numbers": "off",
			"@typescript-eslint/no-unused-expressions": "off",
		},
	},
	{
		...pluginPlaywright.configs["flat/recommended"],
		name: "Playwright",
		files: ["e2e/**"],
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
