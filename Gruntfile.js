/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxar.org/license
 */
/*jshint node: true*/
module.exports = function (grunt) {
   'use strict';

   var pkg = grunt.file.readJSON('package.json');
   var bwr = grunt.file.readJSON('bower.json');
   var src = {
      gruntfile: 'Gruntfile.js',
      require: 'require_config.js',
      laxar_patterns: [pkg.name + '.js', 'lib/**/*.js', '!lib/**/spec/**/*.js'],
      specs: ['lib/**/spec/**/*.js'],
      docs: ['docs/**/*.md']
   };

   grunt.initConfig({
      jshint: {
         options: {
            jshintrc: '.jshintrc'
         },
         gruntfile: {
            options: { node: true },
            src: src.gruntfile
         },
         laxar_patterns: { src: src.laxar_patterns },
         specs: { src: src.specs }
      },
      requirejs: {
         laxar_patterns: {
            options: {
               baseUrl: './',
               mainConfigFile: src.require,
               optimize: 'uglify2',
               preserveLicenseComments: false,
               generateSourceMaps: true,
               exclude: [
                  'angular',
                  'jquery',
                  'underscore',
                  'laxar'
               ],
               name: pkg.name,
               out: 'dist/' + pkg.name + '.js'
            }
         }
      },
      karma: {
         options: {
            basePath: '.',
            frameworks: ['laxar'],
            reporters: ['junit', 'progress'],
            browsers: ['PhantomJS'],
            singleRun: true
         },
         laxar_patterns: {
            options: {
               files: [
                  { pattern: 'bower_components/**', included: false },
                  { pattern: 'lib/**', included: false }
               ],
               laxar: {
                  specRunner: 'lib/spec/spec_runner.js',
                  requireConfig: src.require
               },
               junitReporter: {
                  outputFile: 'lib/junit.xml'
               }
            }
         }
      },
      markdown: {
         docs: {
            files: [ {
               expand: true,
               src: src.docs,
               dest: 'dist/',
               ext: '.html',
               rename: function (dest, src) {
                  return dest + src.replace(/\/README\.html$/, '/index.html');
               }
            } ]
         }
      },
      bower: {
         laxar_patterns: {
            rjsConfig: src.require,
            options: {
               baseUrl: './'
            }
         }
      },
      watch: {
         gruntfile: {
            files: src.gruntfile,
            tasks: ['jshint:gruntfile']
         },
         laxar_patterns: {
            files: src.laxar_patterns,
            tasks: ['jshint:laxar_patterns', 'karma']
         },
         specs: {
            files: src.specs,
            tasks: ['jshint:specs', 'karma']
         },
         docs: {
            files: src.docs,
            tasks: ['markdown']
         }
      }
   });

   grunt.loadNpmTasks('grunt-contrib-jshint');
   grunt.loadNpmTasks('grunt-contrib-requirejs');
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-bower-requirejs');
   grunt.loadNpmTasks('grunt-laxar');
   grunt.loadNpmTasks('grunt-markdown');

   grunt.registerTask('build', ['requirejs']);
   grunt.registerTask('test', ['karma', 'jshint']);
   grunt.registerTask('default', ['build', 'test']);
};
