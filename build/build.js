#!/usr/bin/env node

var buildify = require('buildify'),
		less = require('less'),
		version = "1.1.2",
		buildDate = new Date;

buildify("../js/")
	.load('jquery.onscreen.js')
	.concat(['jquery.onscreen.slideshow.js']) // , 'jquery.onscreen.youtube.js', 'jquery.onscreen.vimeo.js'])
	.wrap('../build/template.js', { version: version, date: buildDate, year: buildDate.getFullYear() })
	.changeDir('../dist/')
	.save('jquery.onscreen-' + version + '.js')
	.symLink('jquery.onscreen-' + version + '.js', 'jquery.onscreen-latest.js')
	.uglify()
	.save('jquery.onscreen-' + version + '.min.js')
	.symLink('jquery.onscreen-' + version + '.min.js', 'jquery.onscreen-latest.min.js');

console.log('JS Build successfull');

var buildCSS = buildify("../less/")
	.load('main.less');

buildCSS.perform(function(content) {
		less.render(content, {
			paths: [buildCSS.dir],     // Specify search paths for @import directives
			filename: 'main.less',  // Specify a filename, for better error messages
			compress: true          // Minify CSS output
		},
		function (err, output) {
			if (err) {
				console.error("LESS compiler error", err);
			} else {
				buildCSS.content = output.css;
				buildCSS
					.changeDir('../css/')
					.save('main.css');
				console.log("main.css generated");
			}
		});
	});


