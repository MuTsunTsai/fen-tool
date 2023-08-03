const $ = require("gulp-load-plugins")();
const gulp = require("gulp");
const sass = require("sass");

const htmlSource = "src/public/index.html";

const purgeOption = {
	content: [htmlSource],
	safelist: {
		variables: [
			"--bs-primary",
			/^--bs-btn-disabled/,
			/^--bs-nav-tabs/,
		],
		standard: ["text-danger"],
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

const esbuildOption = {
	target: ["chrome66", "edge79", "firefox78", "opera53", "safari11.1", "ios11.3"],
	bundle: true,
	treeShaking: true,
	pure: ["RegExp"]
};

gulp.task("css", () =>
	gulp.src("src/public/style.scss")
		.pipe($.newer({
			dest: "docs/style.css",
			extra: [__filename, htmlSource]
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
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.mjs"]
		}))
		.pipe($.esbuild(Object.assign({}, esbuildOption, {
			outfile: "main.js",
			external: ["./modules/*"], // Everything in here are loaded on demand
		})))
		.pipe($.terser())
		.pipe(gulp.dest("docs"))
);

gulp.task("html", () =>
	gulp.src("src/public/**/*.html")
		.pipe($.newer({
			dest: "docs",
			extra: [__filename]
		}))
		.pipe($.replace(/<\/span>\s+<span/gm, "</span>&#32;<span"))
		.pipe($.htmlMinifierTerser(htmlOption))
		.pipe($.replace(/&#32;/g, " "))
		// Avoid VS Code Linter warnings
		.pipe($.replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
		.pipe(gulp.dest("docs"))
);

gulp.task("gen", () =>
	gulp.src("src/js/api/gen.js")
		.pipe($.newer({
			dest: "docs/gen/gen.js",
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.mjs"]
		}))
		.pipe($.esbuild(Object.assign({}, esbuildOption, { outfile: "gen.js" })))
		.pipe($.terser())
		.pipe(gulp.dest("docs/gen"))
);

gulp.task("sw", () =>
	gulp.src("src/service/sw.js")
		.pipe($.esbuild(Object.assign({}, esbuildOption, { outfile: "sw.js" })))
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
				"py.asm.js",
			],
		}))
		.pipe($.terser())
		.pipe(gulp.dest("docs"))
);

gulp.task("sdk", () =>
	gulp.src("src/js/api/sdk.js")
		.pipe($.newer({
			dest: "docs/sdk.js",
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.mjs"]
		}))
		.pipe($.esbuild(Object.assign({}, esbuildOption, { outfile: "sdk.js" })))
		.pipe($.terser())
		.pipe(gulp.dest("docs"))
);

gulp.task("api", () =>
	gulp.src("src/js/api/api.js")
		.pipe($.newer({
			dest: "docs/api/api.js",
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.mjs"]
		}))
		.pipe($.esbuild(Object.assign({}, esbuildOption, { outfile: "api.js" })))
		.pipe($.terser())
		.pipe(gulp.dest("docs/api"))
);

gulp.task("ptt", () =>
	gulp.src("src/js/modules/ptt.js")
		.pipe($.newer({
			dest: "docs/modules/ptt.js",
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.mjs"]
		}))
		.pipe($.esbuild(Object.assign({}, esbuildOption, { outfile: "ptt.js", format: "esm" })))
		.pipe($.terser())
		.pipe(gulp.dest("docs/modules"))
);

gulp.task("chess", () =>
	gulp.src("src/js/modules/chess.mjs")
		.pipe($.newer({
			dest: "docs/modules/chess.js",
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.mjs"]
		}))
		.pipe($.esbuild(Object.assign({}, esbuildOption, { outfile: "chess.js", format: "esm" })))
		.pipe($.terser())
		.pipe(gulp.dest("docs/modules"))
);

gulp.task("popeye", () =>
	gulp.src(["src/js/modules/popeye.js", "src/js/modules/py.js"])
		.pipe($.newer({
			dest: "docs/modules/py.js",
			extra: [__filename]
		}))
		.pipe($.if(file => file.stem == "popeye", $.terser()))
		.pipe($.concat("py.js"))
		.pipe($.terser({ toplevel: true }))
		.pipe(gulp.dest("docs/modules"))
);

gulp.task("pyasm", () =>
	gulp.src(["src/js/modules/popeye.js", "src/js/modules/py.asm.js"])
		.pipe($.newer({
			dest: "docs/modules/py.asm.js",
			extra: [__filename]
		}))
		.pipe($.if(file => file.stem == "popeye", $.terser()))
		.pipe($.concat("py.asm.js"))
		.pipe($.terser()) // cannot drop top-level variables for some reason
		.pipe(gulp.dest("docs/modules"))
);

gulp.task("fa", () =>
	gulp.src(htmlSource)
		.pipe($.fontawesome())
		.pipe(gulp.dest("docs/lib"))
);

gulp.task("default", gulp.series(gulp.parallel("css", "js", "html", "gen", "sdk", "api", "ptt", "chess", "popeye", "pyasm"), "sw"));
