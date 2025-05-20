const fontawesome = require("gulp-fontawesome");
const fs = require("fs");
const gulp = require("gulp");

const vueSource = "src/vue/**/*.vue";

const fontAwesome = () =>
	gulp.src(vueSource)
		.pipe(fontawesome())
		.pipe(gulp.dest("build"));

gulp.task("fa", fontAwesome);

gulp.task("default", cb => {
	if(!fs.existsSync("build/webfonts")) return fontAwesome();
	cb();
});
