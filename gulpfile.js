const $ = require("gulp-load-plugins")();
const gulp = require("gulp");
const sass = require("sass");

const purgeOption = {
	content: ["docs/index.html"],
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
			extra: [__filename, "docs/index.html"]
		}))
		.pipe($.sass(sass)({
			outputStyle: "compressed",
		}))
		.pipe($.purgecss(purgeOption))
		.pipe(gulp.dest("docs"))
);