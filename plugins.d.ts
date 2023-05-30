///<reference types="gulp-load-plugins" />

interface IGulpPlugins {
	esbuild: typeof import("gulp-esbuild");
	fontawesome: typeof import("gulp-fontawesome");
	htmlMinifierTerser: typeof import("gulp-html-minifier-terser");
	newer: typeof import("gulp-newer");
	purgecss: typeof import("gulp-purgecss");
	sass: typeof import("gulp-sass");
	terser: typeof import("gulp-terser");
	workbox: typeof import("gulp-workbox");
}
