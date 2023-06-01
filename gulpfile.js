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
	},
	// for Bootstrap
	variables: true,
};

const htmlOption = {
	"collapseWhitespace": true,
	"removeComments": true,
	"minifyJS": {
		"ie8": true
	}
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
		.pipe($.esbuild({
			outfile: "main.js",
			bundle: true,
		}))
		.pipe($.terser())
		.pipe(gulp.dest("docs"))
);

gulp.task("html", () =>
	gulp.src(htmlSource)
		.pipe($.newer({
			dest: "docs/index.html",
			extra: [__filename]
		}))
		.pipe($.htmlMinifierTerser(htmlOption))
		// Avoid VS Code Linter warnings
		.pipe($.replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
		.pipe(gulp.dest("docs"))
);

gulp.task("imgHtml", () =>
	gulp.src("src/public/img/index.html")
		.pipe($.newer({
			dest: "docs/img/index.html",
			extra: [__filename]
		}))
		.pipe($.htmlMinifierTerser(htmlOption))
		// Avoid VS Code Linter warnings
		.pipe($.replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
		.pipe(gulp.dest("docs/img"))
);

gulp.task("imgJs", () =>
	gulp.src("src/js/api/img.js")
		.pipe($.newer({
			dest: "docs/img/img.js",
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.mjs"]
		}))
		.pipe($.esbuild({
			outfile: "img.js",
			bundle: true,
		}))
		.pipe($.terser())
		.pipe(gulp.dest("docs/img"))
);

gulp.task("sw", () =>
	gulp.src("src/service/sw.js")
		.pipe($.esbuild({
			outfile: "sw.js",
			bundle: true,
		}))
		.pipe($.workbox({
			globDirectory: "docs",
			globPatterns: [
				"**/*.html",
				"**/*.js",
				"**/*.css",
				"**/*.woff2",
				"**/*.png",
			],
			globIgnores: ["sw.js"]
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
		.pipe($.terser())
		.pipe(gulp.dest("docs"))
);

gulp.task("api", () =>
	gulp.src("src/js/api/api.js")
		.pipe($.newer({
			dest: "docs/api/api.js",
			extra: [__filename, "src/js/**/*.js", "src/js/**/*.mjs"]
		}))
		.pipe($.esbuild({
			outfile: "api.js",
			bundle: true,
		}))
		.pipe($.terser())
		.pipe(gulp.dest("docs/api"))
);

gulp.task("apiHtml", () =>
	gulp.src("src/public/api/index.html")
		.pipe($.newer({
			dest: "docs/api/index.html",
			extra: [__filename]
		}))
		.pipe($.htmlMinifierTerser(htmlOption))
		// Avoid VS Code Linter warnings
		.pipe($.replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
		.pipe(gulp.dest("docs/api"))
);

gulp.task("fa", () =>
	gulp.src(htmlSource)
		.pipe($.fontawesome())
		.pipe(gulp.dest("docs/lib"))
);

gulp.task("default", gulp.series(gulp.parallel("css", "js", "html", "imgHtml", "imgJs", "sdk", "api", "apiHtml"), "sw"));
