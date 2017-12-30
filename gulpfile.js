const gulp      = require('gulp');
const minify    = require('gulp-babel-minify');
const htmlmin   = require('gulp-htmlmin');
const cssmin    = require('gulp-cssmin');
const concat    = require('gulp-concat');
const zip       = require('gulp-zip');
const fs        = require('fs');
const mkdirp    = require('mkdirp');
const chalk     = require('chalk');
const watch     = require('gulp-watch');
const webpack   = require('webpack-stream');
const bump      = require('gulp-bump');
const beep      = require('beepbeep'); 

const browsersync = require('browser-sync').create();

// Chalk colors
const ch_error  = chalk.bold.red;
const ch_ok     = chalk.bold.green;
const ch_normal = chalk.white;

let webpack_config = {
    output: {
        filename: 'game.js',
        
    },
    devtool: 'source-map'
};

// Beep on webpack error
// Disable by flipping the bool below to false
let do_beeps = true;
function error_beep() {
    if(do_beeps === true) {
        beep();
    }
}

gulp.on('error', () => {
    beep();
});

// Watch task. Starts up browser-sync and starts watching files for changes.
gulp.task('watch', (done) => {
    browsersync.init({
        server: {
            baseDir: "build",
            index: "index.html"
        }
    });

    gulp.watch('./src/**/*.js', gulp.series('build-js', 'zip', 'check', 'reload'));

    gulp.watch('./src/**/*.html', gulp.series('build-html', 'check', 'reload'));
    
    gulp.watch('./src/**/*.css', gulp.series('build-css', 'check', 'reload'))
        .on('change', browsersync.reload);
    
    gulp.watch('./assets/**/*', gulp.series('build-assets', 'check', 'reload'));
    gulp.watch('./assets/*', gulp.series('build-assets', 'check', 'reload'));
});

// Reloads browser
gulp.task('reload', (done) => {
    browsersync.reload();
    done();
});

// Runs Webpack on JS source files
gulp.task('build-js', (done) => {
    return gulp.src('./src/main.js')
        .pipe(webpack(webpack_config))
        .on('error', (err) => {
            ch_error(err);
            error_beep();
            done();
        })
        .pipe(gulp.dest('./build/'));
});

// Minify HTML
gulp.task('build-html', (done) => {
    return gulp.src('./src/**/*.html')
        .pipe(htmlmin({collapseWhitepspace: true}))
        .pipe(gulp.dest('./build/'));
});

// Minify CSS
gulp.task('build-css', (done) => {
    return gulp.src('./src/**/*.css')
        .pipe(gulp.dest('./build/'));
});

// ZIP build and output to dist folder
gulp.task('zip', (done) => {
    return gulp.src('./build/**/*')
        .pipe(zip('game.zip'))
        .pipe(gulp.dest('./dist/'));
});

// Copy assets to build folder
gulp.task('build-assets', (done) => {
    return gulp.src('./assets/**/*')
        .pipe(gulp.dest('./build/'))
});

// Report distribution size
gulp.task('check', gulp.series('zip', (done) => {
    let stats = fs.statSync('./dist/game.zip');
    let fileSize = stats.size;
    console.log(ch_ok("Your zipped game is " + fileSize + " bytes"))
    done();
}));

gulp.task('pre-build', (done) => {
    webpack_config = {
        output: {
            filename: 'game.js',   
        }
    };
    done();
})

// Manual build task
gulp.task('build', gulp.series('pre-build','build-html', 'build-css', 'build-js', 'build-assets', 'zip', 'check', (done) => {
    done();
}));
