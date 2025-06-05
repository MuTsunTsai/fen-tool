import gulp from "gulp";
import fontawesome from "gulp-fontawesome";
import fs from "fs";

export const fa = () =>
	gulp.src("src/vue/**/*.vue")
		.pipe(fontawesome())
		.pipe(gulp.dest("build"));

export default cb => {
	if(!fs.existsSync("build/webfonts")) return fa();
	cb();
};
