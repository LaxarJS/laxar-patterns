/**
 * Copyright 2017 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/* eslint-env node */

const path = require( 'path' );
const pkg = require( './package.json' );

const webpack = require( 'laxar-infrastructure' ).webpack( {
   context: __dirname,
   module: {
      rules: [
         {
            test: /\.js$/,
            include: [
               path.resolve( __dirname, 'lib/' ),
               path.resolve( __dirname, 'node_modules/laxar/' ),
               path.resolve( __dirname, 'node_modules/laxar-patterns.js' )
            ],
            loader: 'babel-loader'
         }
      ]
   }
} );

module.exports = [
   webpack.library(),
   webpack.browserSpec( [ `./lib/spec/${pkg.name}.spec.js` ] )
];
