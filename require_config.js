var require = {
   baseUrl: './',
   deps: [
      'bower_components/es5-shim/es5-shim',
      'bower_components/modernizr/modernizr'
   ],
   shim: {
      angular: {
         deps: [
            'jquery'
         ],
         exports: 'angular'
      },
      'angular-mocks': {
         deps: [
            'angular'
         ],
         init: function ( angular ) {
            'use strict';
            return angular.mock;
         }
      },
      'angular-route': {
         deps: [
            'angular'
         ],
         init: function ( angular ) {
            'use strict';
            return angular.route;
         }
      },
      'angular-sanitize': {
         deps: [
            'angular'
         ],
         init: function ( angular ) {
            'use strict';
            return angular;
         }
      },
      'json-patch': {
         exports: 'jsonpatch'
      }
   },
   packages: [
      {
         name: 'laxar',
         location: 'bower_components/laxar',
         main: 'laxar_testing'
      }
   ],
   paths: {
      text: 'bower_components/requirejs-plugins/lib/text',
      requirejs: 'bower_components/requirejs/require',
      jquery: 'bower_components/jquery/dist/jquery',
      q_mock: 'bower_components/q_mock/q',
      'json-patch': 'bower_components/fast-json-patch/src/json-patch-duplex',
      jjv: 'bower_components/jjv/lib/jjv',
      jjve: 'bower_components/jjve/jjve',
      json: 'bower_components/requirejs-plugins/src/json',
      'angular-route': 'bower_components/angular-route/angular-route',
      'angular-sanitize': 'bower_components/angular-sanitize/angular-sanitize',
      'angular-mocks': 'bower_components/angular-mocks/angular-mocks',
      angular: 'bower_components/angular/angular',
      jasmine: 'bower_components/jasmine/lib/jasmine-core/jasmine'
   }
};
