const $ = require("gulp-load-plugins")();
const gulp = require("gulp");
const sass = require("sass");
const esVue = require("@mutsuntsai/esbuild-plugin-vue");

globalThis.process.env.NODE_ENV = "production";

require("global-jsdom/register");
globalThis.matchMedia = () => ({ matches: false });
globalThis.HTMLCanvasElement.prototype.getContext = () => ({});
globalThis.addEventListener = globalThis.window.addEventListener.bind(globalThis.window);

const htmlSource = "src/public/index.html";
const vueSource = "src/vue/**/*.vue";

const purgeOption = {
	content: [htmlSource, vueSource],
	safelist: {
		variables: [
			"--bs-primary",
			/^--bs-btn-disabled/,
			/^--bs-nav-tabs/,
		],
		standard: ["text-danger", /backdrop/],
	},
	// for Bootstrap
	variables: true,
};

const htmlOption = {
	collapseWhitespace: true,
	removeComments: true,
	ignoreCustomComments: [],
	minifyCSS: true,
	minifyJS: {
		ie8: true
	}
};

const vueOption = {
	templateOptions: {
		compilerOptions: {
			comments: false,
		},
	},
};

function esb(options) {
	return $.esbuild(Object.assign({}, esbuildOption, options));
}

const esbuildOption = {
	target: ["chrome66", "edge79", "firefox78", "opera53", "safari11.1", "ios11.3"],
	bundle: true,
	treeShaking: true,
	legalComments: "none",
	pure: ["RegExp"],
	define: {
		"__VUE_OPTIONS_API__": "true", // Slicksort needs this
		"__VUE_PROD_DEVTOOLS__": "false",
		"__VUE_PROD_HYDRATION_MISMATCH_DETAILS__": "false",
	},
};

gulp.task("css", () =>
	gulp.src("src/public/style.scss")
		.pipe($.newer({
			dest: "docs/style.css",
			extra: [__filename, htmlSource, vueSource]
		}))
		.pipe($.sass(sass)({
			outputStyle: "compressed",
		}))
		.pipe($.purgecss(purgeOption))
		.pipe(gulp.dest("docs"))
);

gulp.task("js", () =>
	gulp.src("src/js/main.js")
		.pipe($.newer({
			dest: "docs/main.js",
			extra: [__filename, vueSource, "src/js/**/*.js", "src/js/**/*.ts"]
		}))
		.pipe(esb({
			outfile: "main.js",
			external: ["./modules/*"], // Everything in here are loaded on demand
			plugins: [esVue(vueOption)],
			minify: true,
			sourcemap: true,
			sourcesContent: false,
			sourceRoot: "../",
		}))
		.pipe(gulp.dest("docs"))
);

gulp.task("html", () =>
	gulp.src("src/public/**/*.html")
		.pipe($.newer({
			dest: "docs",
			extra: [__filename, vueSource]
		}))
		.pipe($.htmlMinifierTerser(htmlOption))
		.pipe($.vueSsg({
			appRoot: "src/vue/app.vue",
			esbuildOptions: Object.assign({}, esbuildOption, {
				plugins: [esVue(vueOption)],
			}),
		}))
		.pipe(gulp.dest("docs"))
);

gulp.task("gen", () =>
	gulp.src("src/js/api/gen.js")
		.pipe($.newer({
			dest: "docs/gen/gen.js",
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.ts"]
		}))
		.pipe(esb({ outfile: "gen.js" }))
		.pipe($.terser())
		.pipe(gulp.dest("docs/gen"))
);

gulp.task("sw", () =>
	gulp.src("src/service/sw.js")
		.pipe(esb({ outfile: "sw.js" }))
		.pipe($.workbox({
			globDirectory: "docs",
			globPatterns: [
				"**/*.html",
				"**/*.js",
				"**/*.css",
				"**/*.woff2",
				"assets/x1/*.png",
				"assets/x2/*.png",
				"assets/icon/icon-32.png",
				"assets/icon/icon-192.png",
				"**/*.wasm",
			],
			globIgnores: [
				"sw.js",
				"**/py.asm.js",
				"**/stockfish/*",
			],
		}))
		.pipe($.terser())
		.pipe(gulp.dest("docs"))
);

gulp.task("sdk", () =>
	gulp.src("src/js/api/sdk.js")
		.pipe($.newer({
			dest: "docs/sdk.js",
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.ts"]
		}))
		.pipe(esb({ outfile: "sdk.js" }))
		.pipe($.terser())
		.pipe(gulp.dest("docs"))
);

gulp.task("api", () =>
	gulp.src("src/js/api/api.js")
		.pipe($.newer({
			dest: "docs/api/api.js",
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.ts"]
		}))
		.pipe(esb({ outfile: "api.js" }))
		.pipe($.terser())
		.pipe(gulp.dest("docs/api"))
);

gulp.task("ptt", () =>
	gulp.src("src/js/modules/ptt.js")
		.pipe($.newer({
			dest: "docs/modules/ptt.js",
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.ts"]
		}))
		.pipe(esb({ outfile: "ptt.js", format: "esm" }))
		.pipe($.terser())
		.pipe(gulp.dest("docs/modules"))
);

gulp.task("chess", () =>
	gulp.src("src/js/modules/chess.ts")
		.pipe($.newer({
			dest: "docs/modules/chess.js",
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.ts"]
		}))
		.pipe(esb({
			outfile: "chess.js",
			format: "esm",
			minify: true,
			sourcemap: true,
			sourcesContent: false,
			sourceRoot: "../../",
		}))
		.pipe(gulp.dest("docs/modules"))
);

const popeyeVersion = "489";

gulp.task("popeye", () =>
	gulp.src(["src/js/modules/popeye.js", `src/js/vendor/py${popeyeVersion}.js`])
		.pipe($.newer({
			dest: `docs/modules/py${popeyeVersion}.js`,
			extra: [__filename]
		}))
		.pipe($.if(file => file.stem == "popeye", $.terser()))
		.pipe($.concat(`py${popeyeVersion}.js`))
		.pipe($.terser({ toplevel: true }))
		.pipe(gulp.dest("docs/modules"))
);

gulp.task("pyAsm", () =>
	gulp.src(["src/js/modules/popeye.js", `src/js/vendor/py${popeyeVersion}.asm.js`])
		.pipe($.newer({
			dest: `docs/modules/py${popeyeVersion}.asm.js`,
			extra: [__filename]
		}))
		.pipe($.if(file => file.stem == "popeye", $.terser()))
		.pipe($.concat(`py${popeyeVersion}.asm.js`))
		.pipe($.terser()) // cannot drop top-level variables for some reason
		.pipe(gulp.dest("docs/modules"))
);

gulp.task("fa", () =>
	gulp.src("src/vue/**/*.vue")
		.pipe($.fontawesome())
		.pipe(gulp.dest("docs/lib"))
);

gulp.task("default", gulp.series(gulp.parallel("css", "js", "html", "gen", "sdk", "api", "ptt", "chess", "popeye", "pyAsm"), "sw"));
