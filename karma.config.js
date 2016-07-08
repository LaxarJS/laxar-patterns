// Karma configuration for LaxarJS core
/* eslint-env node */


const webpackConfig = Object.assign( {}, require('./webpack.base.config' ) );
delete webpackConfig.entry.laxar;
delete webpackConfig.plugins;
webpackConfig.devtool = 'inline-source-map';
const polyfillPath = require.resolve( 'laxar/dist/polyfills' );

module.exports = function(config) {
   config.set({

      // frameworks to use
      // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
      frameworks: [ 'jasmine' ],

      // list of files / patterns to load in the browser
      files: [
         polyfillPath,
         '**/spec/spec-runner.js'
      ],
      preprocessors: {
         '**/spec/spec-runner.js': [ 'webpack', 'sourcemap' ]
      },

      webpack: webpackConfig,

      // test results reporter to use
      // possible values: 'dots', 'progress'
      // available reporters: https://npmjs.org/browse/keyword/karma-reporter
      reporters: [ 'progress' ],
      unit: {
         singleRun: true,
      },
      junitReporter: {
         outputDir: 'karma-output/'
      },

      // web server port
      port: 9876,

      // start these browsers
      // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
      browsers: [
         // 'MSIE',
         'PhantomJS',
         // 'Chrome',
         // 'Firefox'
      ],
      browserNoActivityTimeout: 100000,

      // Continuous Integration mode
      // if true, Karma captures browsers, runs the tests and exits
      singleRun: true,
      // enable / disable watching file and executing tests whenever any file changes
      autoWatch: false,
   });
};
