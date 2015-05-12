/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxar.org/license
 */
/*jshint node: true*/
module.exports = function( grunt ) {
   'use strict';

   var pkg = grunt.file.readJSON( 'package.json' );
   var src = {
      gruntfile: 'Gruntfile.js',
      require: 'require_config.js',
      'laxar-patterns': [ pkg.name + '.js', 'lib/**/*.js', '!lib/**/spec/**/*.js' ],
      specs: [ 'lib/**/spec/**/*.js' ],
      docs: [ 'docs/**/*.md' ]
   };

   grunt.initConfig( {
      jshint: {
         options: {
            jshintrc: '.jshintrc'
         },
         gruntfile: {
            options: { node: true },
            src: src.gruntfile
         },
         'laxar-patterns': { src: src[ pkg.name ] },
         specs: { src: src.specs }
      },
      karma: {
         options: {
            basePath: '.',
            frameworks: [ 'laxar' ],
            reporters: [ 'junit', 'coverage', 'progress' ],
            browsers: [ 'PhantomJS' ],
            singleRun: true,
            preprocessors: {
               'lib/**/*.js': 'coverage'
            },
            proxies: {},
            files: [
               { pattern: 'bower_components/**', included: false },
               { pattern: 'lib/**', included: false },
               { pattern: '*.js', included: false }
            ]
         },
         'laxar-patterns': {
            options: {
               laxar: {
                  specRunner: 'lib/spec/spec_runner.js',
                  requireConfig: src.require
               },
               junitReporter: {
                  outputFile: 'lib/spec/test-results.xml'
               },
               coverageReporter: {
                  type: 'lcovonly',
                  dir: 'lib/spec',
                  file: 'lcov.info'
               }
            }
         }
      },
      test_results_merger: {
         laxar: {
            src: [ 'lib/spec/test-results.xml' ],
            dest: 'test-results.xml'
         }
      },
      lcov_info_merger: {
         laxar: {
            src: [ 'lib/spec/*/lcov.info' ],
            dest: 'lcov.info'
         }
      },
      watch: {
         gruntfile: {
            files: src.gruntfile,
            tasks: [ 'jshint:gruntfile']
         },
         'laxar-patterns': {
            files: src[ pkg.name ],
            tasks: [ 'jshint:laxar-patterns', 'karma' ]
         },
         specs: {
            files: src.specs,
            tasks: [ 'jshint:specs', 'karma' ]
         }
      }
   } );

   grunt.loadNpmTasks( 'grunt-contrib-jshint' );
   grunt.loadNpmTasks( 'grunt-contrib-watch' );
   grunt.loadNpmTasks( 'grunt-laxar' );

   grunt.registerTask( 'test', [ 'karma', 'test_results_merger', 'lcov_info_merger', 'jshint' ] );
   grunt.registerTask( 'default', [ 'test' ] );
};
