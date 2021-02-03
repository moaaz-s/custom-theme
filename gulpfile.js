const YAML = require('yaml')
const FS   = require('fs');
const file = FS.readFileSync('./config.yml', 'utf8')
const shopifyConfig = YAML.parse(file);


/**
 * Settings
 * Turn on/off build features
 */

var settings = {
	clean     : true,
	scripts   : true,
	copy      : true,
	reload    : true,
	themes    : true,

	// Only add if required for testing & live sync
	shopify   : {
		dev_env: "development",
		allow_live: true
	}
};


/**
 * Paths to project folders
 */

var paths = {
	input: 'src/',
	output: 'dist/',
	scripts: {
		folder: 'src/js',
		files_list: './src/js/order.json',
		output: 'dist/assets/'
	},
	themes: {
		folder : 'src/scss',
		input  : 'src/scss/main.{scss,sass}',
		html   : '/html/**/*.html',
		output : 'dist/assets/'
	},
	themekit_watch: [
		//"dis/shopify/assets/lpb-templates.min.js",
		"dis/shopify/assets/lmem-templates.min.js",
		//"dis/shopify/assets/lpbmain.css",
		"dis/shopify/assets/lmemmain.css",
		"dis/shopify/assets/ScriptTag.min.js",
		"dis/shopify/assets/ScriptTag.js",
		"dis/shopify/assets/config.json",
		"dis/shopify/templates/page.custom_cart.liquid",
		"dis/shopify/layout/theme.liquid"
	],
	copy: {
		input: 'src/**/*',
		output: 'dist/shopify/'
	},
	reload: './dist/'
};

/**
 * Template for banner to add to file headers
 */

var banner = {
	main:
		'/*!' +
		' <%= package.name %> v<%= package.version %>' +
		' | (c) ' + new Date().getFullYear() + ' <%= package.author.name %>' +
		' | <%= package.repository.url %>' +
		' */\n'
};


/**
 * Gulp Packages
 */

// General
var {gulp, src, dest, watch, series, parallel} = require('gulp');
var del = require('del');
var flatmap = require('gulp-flatmap');
var lazypipe = require('lazypipe');
var rename = require('gulp-rename');
var header = require('gulp-header');
var package = require('./package.json');

// Scripts
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var concat = require('gulp-concat');
var uglify = require('gulp-terser');
var optimizejs = require('gulp-optimize-js');

// Styles
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var prefix = require('autoprefixer');
var minify = require('cssnano');

// HTML
const htmlmin = require('gulp-htmlmin');
const through = require('through2')

// Shopify
const themeKit = require('@shopify/themekit');
// var gulpShopify = require('./custom_shopify_upload_gulp'); //require('gulp-shopify-upload');

// BrowserSync
var browserSync = require('browser-sync').create();
const { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } = require('constants');



/**
 * Gulp Tasks
 */

// Remove pre-existing content from output folders
var cleanDist = function (done) {

	// Make sure this feature is activated before running
	if (!settings.clean) return done();

	// Clean the dist folder
	del.sync([
		// paths.output
		'dist/shopify/assets',
		'dist/shopify/config',
		'dist/shopify/locals',
		'dist/shopify/sections',
		'dist/shopify/snippets',
		'dist/shopify/assets',
		'dist/shopify/layout',
		'dist/shopify/templates'
	]);

	// Signal completion
	return done();
};

// Repeated JavaScript tasks
var jsTasks = lazypipe()
	.pipe(header, banner.main, {package: package})
	// .pipe(optimizejs)
	.pipe(dest, paths.scripts.output)
	.pipe(rename, {suffix: '.min'})
	.pipe(uglify)
	// .pipe(optimizejs)
	.pipe(header, banner.main, {package: package})
	.pipe(dest, paths.scripts.output);

var getJavascriptFiles = () => {
	var files = require(paths.scripts.files_list);
	return files.map((file) => `${paths.scripts.folder}/${file}` )
}

// Lint, minify, and concatenate scripts
var buildScripts = async function (done) {

	// Make sure this feature is activated before running
	if (!settings.scripts) return done();

	var files = getJavascriptFiles();
	src(files)
		.pipe(concat('theme.js'))
		.pipe(jsTasks());

	done();
};

// Lint scripts
var lintScripts = function (done) {

	// Make sure this feature is activated before running
	if (!settings.scripts) return done();

	// Lint scripts
	var files = getJavascriptFiles();
	return src(files)
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'));

	// return src(paths.scripts.input)
	// 	.pipe(jshint())
	// 	.pipe(jshint.reporter('jshint-stylish'));

};

var buildThemesStyles = function (done) {

	// Make sure this feature is activated before running
	if (!settings.themes) return done();

	// Run tasks on all Sass files
	return src(paths.themes.input)
		.pipe(sass({
			outputStyle: 'expanded',
			sourceComments: true
		}).on('error', sass.logError))
		.pipe(rename({basename: 'styles'}))
		.pipe(postcss([
			prefix({
				cascade: true,
				remove: true
			})
		]))
		.pipe(header(banner.main, {package: package}))
		.pipe(dest(paths.themes.output))
		.pipe(rename({basename: 'styles.min'}))
		.pipe(postcss([
			minify({
				discardComments: {
					removeAll: true
				}
			})
		]))
		.pipe(dest(paths.themes.output))
}

var buildThemesTemplates = function (done) {
	// Make sure this feature is activated before running
	if (!settings.themes) return done();

	const convertHtmlToJs = (file, enc, cb) => {
		var newContent = `
			const zSideCartTemplates = ` + "`" + file.contents + "`" + `;

			function htmlToElement(html) {
				var templatesParent = document.createElement('div');
				templatesParent.innerHTML = "<div>" + html + "</div>";
				return templatesParent.firstChild;
			}

			const templates = htmlToElement(zSideCartTemplates);
			// [].forEach.call(templates, template => {
				document.body.append(templates);
			// });
		`
		file.contents = Buffer.from(newContent);

		cb(null, file)
	}

	// Run tasks on all Sass files
    return src(paths.themes.input)
		.pipe(flatmap(function(stream, file) {
			if (!file.isDirectory())
				return stream.pipe(file);

			// If the file is a directory
			src(file.path + paths.themes.html)
				.pipe(concat(`${file.relative}-templates.js`))
				.pipe(through.obj(convertHtmlToJs))
				.pipe(dest(paths.themes.output))
				.pipe(rename({suffix: '.min'}))
				.pipe(htmlmin({ collapseWhitespace: true }))
				.pipe(dest(paths.themes.output));

			return stream;
		}));
}

// Copy static files into output folder
var copyFiles = function (done) {

	// Make sure this feature is activated before running
	if (!settings.copy) return done();

	// Copy static files
	return src([paths.copy.input, '!' + paths.scripts.folder, '!' + paths.themes.folder])
		.pipe(dest(paths.copy.output));

};

// Watch for changes to the src directory
var startServer = function (done) {

	// Make sure this feature is activated before running
	if (!settings.reload) return done();

	var bsConfig = {};

	if (settings.shopify) {
		const devConfig = shopifyConfig[settings.shopify.dev_env];
		if (devConfig) {
			const url = `https://${devConfig.store}?preview_theme_id=${devConfig.theme_id}`;
			// bsConfig.https = true;
			bsConfig.proxy = url;
			bsConfig.logPrefix = 'Your Project';
			// To inject BS script in the head and not in the body (which doesn't work for shopify)
			// + Add custom css to hide admin bar only for dev.
			bsConfig.snippetOptions = {
				rule: {
				  match: /<head[^>]*>/i,
				  fn: function(snippet, match) {
					return '<style>iframe[src="//localhost:3000/preview_bar"] { display:none; }</style>' +  match + snippet;
				  }
				}
			}
			// coz sometimes reloading happens before all files are synced.
			bsConfig.reloadDelay = 1500;
		}
	} else {
		bsConfig.server = {
			baseDir: paths.reload
		}
	}

	// Initialize BrowserSync
	browserSync.init(bsConfig);

	// Signal completion
	done();

};

// Reload the browser when files change
var reloadBrowser = function (done) {
	if (!settings.reload) return done();
	browserSync.reload({stream: true});
	done();
};

// Watch for changes
var watchSource = function (done) {
	watch(paths.input, series(exports.default, reloadBrowser));
	done();
};

// Watch for changes
var watchDestination = function (done) {
	if (!settings.shopify) return done();

	themeKit.command('watch', {
		env: settings.shopify.dev_env,
		dir: "dist/shopify",
		files: paths.themekit_watch,
		allowLive: settings.shopify.allow_live
	});

	done();
};

var deployScriptTag = function () {
	// for production deployment, maybe we should call a script that loops over all users to update their respective copy ?
}

/**
 * Export Tasks
 */

// Default task
// gulp
exports.default = series(
	cleanDist,
	parallel(
		buildScripts,
		// lintScripts,
		buildThemesStyles, // buildStyles,
		// buildThemesTemplates,
		copyFiles
	),
	// cleanCssAssets
);

// Watch and reload
// gulp watch
exports.watch = series(
	exports.default,
	startServer,
	watchSource,
	watchDestination
);

// Update ScriptTag
// exports.deploy = series(
// 	exports.default,
// 	deployScriptTag
// );
