var gulp = require('gulp');
var babelify = require('babelify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

gulp.task('default', () => {
  browserify('./src/bitapi.js', {standalone: 'bitcoin', debug: true})
  .transform(babelify, { presets : [ 'es2015' ] })
  .bundle()
  .pipe(source('bundle.js'))
  .pipe(gulp.dest('static/scripts'))
  .pipe(buffer())     // You need this if you want to continue using the stream with other plugins
});