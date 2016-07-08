/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/* eslint-env node */

module.exports = {
   entry: {
      'laxar-patterns': './laxar-patterns.js'
   },
   resolve: {},
   module: {
      noParse: /node_modules\/page\/page\.js/,
      loaders: [
         {
            test: /\.js$/,
            exclude: /(node_modules)\/(?!laxar.*)/,
            loader: 'babel-loader'
         }
      ]
   }
};
