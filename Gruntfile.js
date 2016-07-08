/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxar.org/license
 */
/* eslint-env node */
module.exports = function( grunt ) {
   'use strict';

   const pkg = grunt.file.readJSON( 'package.json' );

   grunt.initConfig( {
      pkg: pkg,
      pkgFile: 'package.json',
      clean: {
         apidoc: {
            src: [ 'docs/api/*.js.md' ]
         }
      },
      laxar_dox: {
         default: {
            files: [ {
               src: [
                  'lib/*.js'
               ],
               dest: 'docs/api/'
            } ]
         }
      }
   } );

   grunt.loadNpmTasks( 'grunt-contrib-clean' );
   grunt.loadNpmTasks( 'grunt-laxar' );

   grunt.registerTask( 'apidoc', [ 'clean:apidoc', 'laxar_dox' ] );
   grunt.registerTask( 'default', [ 'apidoc' ] );
};
