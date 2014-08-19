#!/usr/bin/env node

var buildify = require('buildify'),
    version = "0.93";

buildify("../js/")
  .load('jquery.onscreen.js')
  .concat(['jquery.onscreen.youtube.js', 'jquery.onscreen.vimeo.js'])
  .wrap('../build/template.js', { version: version, date: new Date })
  .changeDir('../dist/')
  .save('jquery.onscreen-' + version + '.js')
  .uglify()
  .save('jquery.onscreen-' + version + '.min.js');

console.log('Build successfull');
