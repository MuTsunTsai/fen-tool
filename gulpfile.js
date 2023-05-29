const $ = require("gulp-load-plugins")();
const gulp = require("gulp");
const sass = require("sass");

const purgeOption = {
	content: ["src/index.html"],
	safelist: {
		variables: [
			"--bs-primary",
			/^--bs-btn-disabled/,
			/^--bs-nav-tabs/,
		],
	},
	// for Font Awesome
	keyframes: true,
	fontFace: true,

	// for Bootstrap
	variables: true,
};

gulp.task("css", () =>
	gulp.src("src/style.scss")
		.pipe($.newer({
			dest: "docs/style.css",
			extra: [__filename, "src/index.html"]
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
			extra: [__filename, "src/**/*.js"]
		}))
		.pipe($.esbuild({
			outfile: "main.js",
			bundle: true,
		}))
		.pipe($.terser())
		.pipe(gulp.dest("docs"))
);

gulp.task("html", () =>
	gulp.src("src/index.html")
		.pipe($.newer({
			dest: "docs/index.html",
			extra: [__filename]
		}))
		.pipe($.htmlMinifierTerser({
			"collapseWhitespace": true,
			"removeComments": true,
			"minifyJS": {
				"ie8": true
			}
		}))
		// Avoid VS Code Linter warnings
		.pipe($.replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
		.pipe(gulp.dest("docs"))
);

gulp.task("default", gulp.parallel("css", "js", "html"));
