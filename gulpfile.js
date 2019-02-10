const { watch, series, parallel, src, dest, gulp } = require('gulp');
const livereload = require('gulp-livereload'); // Triggers livereload on file changes
const del = require('del'); // Empty folders before compiling
const rename = require('gulp-rename'); // Rename files after compile
const cache = require('gulp-cache'); // A temp file based caching proxy task for gulp.
const uglify = require('gulp-uglify'); // JavaScript Minifier
const sass = require('gulp-sass'); // Gulp Sass plugin
const sassPartialsImported = require('gulp-sass-partials-imported'); // Import Sass partials
const cleanCSS = require('gulp-clean-css'); // CSS Minifier
const inject = require('gulp-inject'); // Injects CSS/JS into html
const connect = require('gulp-connect'); // Runs a local webserver
const open = require('gulp-open'); // Opens a URL in a web browser

// General Config Vars
const config = {
    port: 8080,
    devBaseUrl: 'http://localhost',
    paths: {
        root: './src/',
        html: './src/*.html',
        scss: './src/scss/',
        js: './src/js/*.js',
        images: './src/img/**',
        dist: './dist/',
        distCSSDir: './dist/css/',
        distJSDir: './dist/js/',
        distIMGDir: './dist/img/',
        node_modules:'./node_modules/'
    }
}

// Removes files and folders. Deprecated but still works.
// https://www.npmjs.com/package/gulp-clean
function clean(done) {
  return del([config.paths.dist + '*']);
  done();
}

// Compile Bootstrap SASS
function bootstrapCompile(done) {
  return src(config.paths.scss + 'bootstrap.scss')
  .pipe(sassPartialsImported(config.paths.scss, config.paths.scss))
  .pipe(cache(sass({ includePaths: config.paths.scss }).on('error', sass.logError)))
  .pipe(cleanCSS())
  .pipe(rename({ extname: '.css' }))
  .pipe(dest(config.paths.distCSSDir));
  done();
}

// Compile any JS files in JS folder
function jsCompile(done) {
  return src(config.paths.js)
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(dest(config.paths.distJSDir));
    done();
}

// Move files to dist
function moveFiles(done) {
  return src(config.paths.html)
    .pipe(dest(config.paths.dist));
    done();
}

// A stylesheet, javascript and webcomponent reference injection plugin for gulp.
// https://www.npmjs.com/package/gulp-inject
function injectFiles(done) {
  var target = src(config.paths.dist + 'index.html');
  var sources = src([
    config.paths.distJSDir + '*.js',
    config.paths.distCSSDir + '*.css'
  ], {read: false});
  return target.pipe(inject(sources, {relative: true}))
  .pipe(dest(config.paths.dist))
  .pipe(livereload());
  done();
}

// Launch Chrome web browser
// https://www.npmjs.com/package/gulp-open
function openBrowser(done) {
  var options = {
    uri: 'http://localhost:' + config.port,
    app: 'Google Chrome'
  };
  return src(config.paths.dist + 'index.html')
  .pipe(open(options));
  done();
}


// Gulp plugin to run a webserver (with LiveReload)
// https://www.npmjs.com/package/gulp-connect
function server(done) {
  return connect.server({
    root: config.paths.dist,
    port: config.port,
    debug: true,
  });
  done();
}

// Build Tasks
function buildTasks(done) {
  return series(clean, bootstrapCompile, jsCompile, moveFiles, injectFiles);
  done();
}

// Watch Task
// Gulp will watch all on events with a set delay followed by build task.
function watchTasks(done) {
  return watch([config.paths.html, config.paths.scss, config.paths.js], { events: 'all', delay: 200}, buildTasks(), livereload.listen());
  done();
}

// Empty Folders
/*
Run gulp clean command for a clean slate in dist directory.
You will need to run the command gulp build again to prevent errors.
*/
exports.clean = function(done) {
  clean();
  done();
}

/*
The default gulp command.
*/
exports.default = series(clean, bootstrapCompile, jsCompile, moveFiles, injectFiles, openBrowser, parallel(server, watchTasks));
