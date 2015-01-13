#!/usr/bin/env node

var buildify = require('buildify'),
	fs = require('fs'),
    version = "1.0rc3",
    buildDate = new Date;

buildify("../js/")
  .load('jquery.onscreen.js')
  .concat(['jquery.onscreen.slideshow.js', 'jquery.onscreen.youtube.js', 'jquery.onscreen.vimeo.js'])
  .wrap('../build/template.js', { version: version, date: buildDate, year: buildDate.getFullYear() })
  .changeDir('../dist/')
  .save('jquery.onscreen-' + version + '.js')
  .symLink('jquery.onscreen-' + version + '.js', 'jquery.onscreen-latest.js')
  .uglify()
  .save('jquery.onscreen-' + version + '.min.js')
  .symLink('jquery.onscreen-' + version + '.min.js', 'jquery.onscreen-latest.min.js');

// process.chdir('../dist/');
// fs.symlinkSync('jquery.onscreen-' + version + '.js', 'jquery.onscreen-latest.js');
// fs.symlinkSync('jquery.onscreen-' + version + '.min.js', 'jquery.onscreen-latest.min.js');

console.log('Build successfull');
