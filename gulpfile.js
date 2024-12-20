const esbuild = require("gulp-esbuild");
const esVue = require("@mutsuntsai/esbuild-plugin-vue");
const fontawesome = require("gulp-fontawesome");
const gulp = require("gulp");
const htmlMinifierTerser = require("gulp-html-minifier-terser");
const newer = require("gulp-newer");
const vueSsg = require("gulp-vue-ssg");

globalThis.process.env.NODE_ENV = "production";

require("global-jsdom/register");
globalThis.matchMedia = () => ({ matches: false });
globalThis.HTMLCanvasElement.prototype.getContext = () => ({});
globalThis.addEventListener = globalThis.window.addEventListener.bind(globalThis.window);

const vueSource = "src/vue/**/*.vue";

const htmlMinOption = {
	collapseWhitespace: true,
	removeComments: true,
	minifyJS: {
		ie8: true,
	},
};

const vueOption = {
	templateOptions: {
		compilerOptions: {
			comments: false,
		},
	},
};

const esbuildOption = {
	target: ["chrome66", "edge79", "firefox78", "opera53", "safari11.1", "ios11.3"],
	bundle: true,
	treeShaking: true,
	legalComments: "none",
	pure: ["RegExp"],
	logLevel: "error", // silence warnings
	define: {
		__VUE_OPTIONS_API__: "true", // Slicksort needs this
		__VUE_PROD_DEVTOOLS__: "false",
		__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
	},
};

gulp.task("html", () =>
	gulp.src("src/app/index.html")
		.pipe(newer({
			dest: "build/index.html",
			extra: [__filename, vueSource],
		}))
		.pipe(htmlMinifierTerser(htmlMinOption))
		.pipe(vueSsg({
			appRoot: "src/vue/app.vue",
			esbuildOptions: Object.assign({}, esbuildOption, {
				plugins: [esVue(vueOption)],
			}),
		}))
		.pipe(gulp.dest("build"))
);

gulp.task("fa", () =>
	gulp.src("src/vue/**/*.vue")
		.pipe(fontawesome())
		.pipe(gulp.dest("build"))
);

gulp.task("default", gulp.series("html"));
