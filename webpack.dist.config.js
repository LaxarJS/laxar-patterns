/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

/**
 * Webpack configuration for the standalone laxar dist bundle.
 * A source map is generated, but the bundle is not minified.
 */

/* eslint-env node */

const path = require( 'path' );
const webpack = require( 'webpack' );

const baseConfig = require( './webpack.base.config' );

module.exports = [
   distConfig(),
   distMinConfig()
];

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function distConfig() {

   const config = Object.assign( {}, baseConfig );

   config.output = {
      path: path.resolve( __dirname ),
      filename: 'dist/laxar-patterns.js',
      library: 'laxar',
      libraryTarget: 'umd',
      umdNamedDefine: true
   };

   config.externals = {
      'fast-json-patch': 'fast-json-patch',
      'laxar': 'laxar',
      'page': 'page',
      'jjv': 'jjv',
      'jjve': 'jjve'
   };

   config.plugins = [
      new webpack.SourceMapDevToolPlugin( {
         filename: 'dist/laxar-patterns.js.map'
      } )
   ];

   return config;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function distMinConfig() {

   const config = Object.assign( {}, distConfig() );

   config.output = Object.assign( {}, config.output, {
      filename: 'dist/laxar-patterns.min.js'
   } );

   config.plugins = [
      new webpack.SourceMapDevToolPlugin( {
         filename: 'dist/laxar-patterns.min.js.map'
      } ),
      new webpack.optimize.UglifyJsPlugin( {
         compress: {
            warnings: true
         },
         sourceMap: true
      } )
   ];

   return config;
}
