'use strict';

const pkg = require('./package.json');
console.log('-'.repeat(38) + '\n' + pkg.name + ' version:' + pkg.version + '\n' + '-'.repeat(38));

/**
 * CLIでの引数を判定
 */
const argv = process.argv.slice(2);
let param = new Object();
argv.forEach((item, i) => {
  if(i % 2 === 0 && /--/.test(item) && !/--/.test(argv[i + 1])) param[item] = argv[i + 1];
});

/**
 * 環境設定
 */
const CONFIG_PATH = {
  src: 'public/',
  release: 'release/',
  cms: 'cms/',
  dev: 'develop/',
  assets: 'public/assets/',
  php: 'php/'
};
const CONFIG = {
  outputDirectory: {
    dev: CONFIG_PATH.src,
    assets: CONFIG_PATH.assets,
    release: CONFIG_PATH.release,
    img: CONFIG_PATH.dev + 'assets/img/',
  },
  sourceDirectory: {
    sass: CONFIG_PATH.dev + '**/*.scss',
    js: CONFIG_PATH.dev + '**/*.js',
    es6: CONFIG_PATH.dev + '**/*.es6',
    img: CONFIG_PATH.src + 'assets/img/**/*'
  },
  watchDirectory: {
    html: CONFIG_PATH.src + '**/*.html',
    php: CONFIG_PATH.src + '**/*.php',
    css: CONFIG_PATH.src + '**/*.css',
    sass: CONFIG_PATH.dev + '**/*.scss',
    js: CONFIG_PATH.src + '**/*.js',
    es6: CONFIG_PATH.dev + '**/*.es6'
  },
  watchIgnoreDirectory: {
    html: [
      '!' + CONFIG_PATH.src + '**/vender/*.html',
      '!' + CONFIG_PATH.src + '_**/*.html'
    ],
    js: [
      '!' + CONFIG_PATH.src + '**/vender/*.js',
      '!' + CONFIG_PATH.src + '**/libs/*.js'
    ]
  },
  deployDirectory: [
    CONFIG_PATH.src + '**/*',
    '!' + CONFIG_PATH.src + '_*/**',
    '!' + CONFIG_PATH.src + 'vender/**',
    '!' + CONFIG_PATH.src + 'vendor/**',
    '!' + CONFIG_PATH.src + '**/_*.css',
    '!' + CONFIG_PATH.src + '**/*.scss',
    '!' + CONFIG_PATH.src + '**/*.es6'
  ]
};
const SASS_AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ios >= 8',
  'android >= 4.4',
  'last 2 versions'
];
const SASS_OUTPUT_STYLE = 'expanded'; //nested, compact, compressed, expanded.

/**
 * IMPORT MODULES
 */
const gulp = require('gulp');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const postcss = require('gulp-postcss');
const csscomb = require('gulp-csscomb');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const htmlhint = require('gulp-htmlhint');
const cache = require('gulp-cached');
const progeny = require('gulp-progeny');
const plumber = require('gulp-plumber');
const ignore = require('gulp-ignore');
const uglify = require('gulp-uglify');
const notifier = require('node-notifier');
const pixrem = require('pixrem');
const postcssOpacity = require('postcss-opacity');
const autoprefixer = require('autoprefixer');
const cssMqpacker = require('css-mqpacker');
const cssnano = require('cssnano');
const browserSync = require('browser-sync').create();
const runSequence = require('run-sequence');

const webpack = require('webpack');
const webpackStream = require('webpack-stream');
runSequence.options.ignoreUndefinedTasks = true;

/**
 * Sass Task
 */
gulp.task('sass', () => {

  const SASS_CONFIG = {
    outputStyle: 'expanded', //nested, compact, compressed, expanded.
    indentType: 'space',
    indentWidth: 2,
    precision: 3
  };
  const SASS_AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ios >= 9',
    'android >= 4.4',
    'last 2 versions'
  ];
  let POSTCSS_PLUGINS = [
    autoprefixer({browsers: SASS_AUTOPREFIXER_BROWSERS}),
    cssMqpacker(),
    pixrem(),
    postcssOpacity()
  ];
  if(param['--cssmin']) POSTCSS_PLUGINS.push(cssnano({autoprefixer: false}));

  return gulp.src(CONFIG.sourceDirectory.sass)
    .pipe(cache('sass'))
    .pipe(progeny({
      multipass: [
        /@import[^;:]+;/g,
        /\s*['"][^'"]+['"]\s*,?/g,
        /(?:['"])([^'"]+)/
      ]
    }))
    .pipe(plumber())
    .pipe(sass(SASS_CONFIG).on('error', sass.logError))
    .pipe(csscomb())
    .pipe(postcss(POSTCSS_PLUGINS))
    .pipe(gulp.dest(CONFIG.outputDirectory.dev));
});

/**
 * HtmlLint Task
 */
gulp.task('htmllint', () => {

  const HTMLLINT_CONFIG = {
    'tagname-lowercase': true,
    'attr-lowercase': true,
    'attr-value-double-quotes': true,
    'attr-value-not-empty': false,
    'attr-no-duplication': true,
    'doctype-first': false,
    'tag-pair': true,
    'tag-self-close': false,
    'spec-char-escape': true,
    'id-unique': true,
    'src-not-empty': true,
    'alt-require': true,
    'head-script-disabled': false,
    'img-alt-require': true,
    'doctype-html5': true,
    'id-class-value': 'false',
    'style-disabled': false,
    'space-tab-mixed-disabled': true,
    'id-class-ad-disabled': true,
    'href-abs-or-rel': false,
    'attr-unsafe-chars': true
  };

  let _target = CONFIG.watchIgnoreDirectory.html.slice();
  _target.unshift(CONFIG.watchDirectory.html);

  return gulp.src(_target)
    .pipe(plumber())
    .pipe(htmlhint(HTMLLINT_CONFIG))
    .pipe(htmlhint.reporter());
});

/**
 * Js Task
 */
gulp.task('js_babel', () => {
  let _target = CONFIG.watchIgnoreDirectory.js.slice();
  _target.unshift(CONFIG.sourceDirectory.es6);

  return gulp.src(_target)
    .pipe(plumber())
    .pipe(babel())
    .pipe(gulp.dest(CONFIG.outputDirectory.dev));
});

/**
 * Webpack Task
 */
const webpackConfig = require('./webpack.config');
gulp.task('webpack', () => {
  return webpackStream(webpackConfig, webpack)
    .pipe(plumber())
    .pipe(gulp.dest(`${CONFIG.outputDirectory.assets}js/`));
});

/**
 * Js Task
 */
gulp.task('js_lint', () => {
  let _target = CONFIG.watchIgnoreDirectory.js.slice();
  _target.unshift(CONFIG.sourceDirectory.js);

  return gulp.src(_target)
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

/**
 * Minify Task */
gulp.task('js_min', () => {
  let _target = CONFIG.watchIgnoreDirectory.js.slice();
  _target.unshift(CONFIG.sourceDirectory.js);

  return gulp.src(_target)
    .pipe(uglify({output: {ascii_only: true}}))
    .pipe(gulp.dest(CONFIG.outputDirectory.dev));
});

/**
 * Watch Task
 */
gulp.task('watch', ['server'], () => {

  // Set Watch Tasks.
  gulp.watch(CONFIG.watchDirectory.sass, ['sass']);
  gulp.watch(CONFIG.watchDirectory.es6, ['js_babel']);
  gulp.watch(CONFIG.watchDirectory.html, ['htmllint']);
  gulp.watch(CONFIG.watchDirectory.js, ['js_lint']);
  gulp.watch(CONFIG.sourceDirectory.js, ['webpack']);

  notifier.notify({
    title: 'Start Gulp',
    message: new Date(),
    sound: 'Glass'
  });

});

/**
 * Server Task
 */
gulp.task('server', () => {

  // Set BrowserSync server.
  if(param['--proxy']){
    browserSync.init({
      proxy: param['--proxy']
    });
  }else{
    browserSync.init({
      server: {
        baseDir: CONFIG.outputDirectory.dev
      }
    });
  }

  // Browser reload.
  gulp.watch(CONFIG.watchDirectory.html, browserSync.reload);
  gulp.watch(CONFIG.watchDirectory.js, browserSync.reload);
  gulp.watch(CONFIG.watchDirectory.php, browserSync.reload);
  gulp.watch(CONFIG.watchDirectory.css, () => {
    gulp.src(CONFIG.watchDirectory.css).pipe(browserSync.stream());
  });

});

/**
 * Deploy Task
 */
gulp.task('deploy', () => {
  notifier.notify({
    title: 'Deploy',
    message: new Date(),
    sound: 'Glass'
  });

  let _target = CONFIG.deployDirectory.slice();

  return gulp.src(_target)
    .pipe(ignore.include({isFile: true}))
    .pipe(gulp.dest(CONFIG.outputDirectory.release));
});

/**
 * Default Task
 */
gulp.task('default', (callback) => {
  return runSequence(['js_babel', 'sass'], ['htmllint', 'js_lint'], 'webpack', 'watch', callback);
});

/**
 * Release Task
 */
let releaseTaskAdd = [];
if(param['--jsmin']) releaseTaskAdd.push('js_min');
if(!releaseTaskAdd.length) releaseTaskAdd = null;
gulp.task('release', (callback) => {
  return runSequence(['js_babel', 'sass'], ['htmllint', 'js_lint'], 'webpack', releaseTaskAdd, 'deploy', callback);
});