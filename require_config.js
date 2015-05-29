var require = {
   baseUrl: './bower_components/',
   paths: {
      requirejs: 'requirejs/require',
      text: 'requirejs-plugins/lib/text',
      json: 'requirejs-plugins/src/json',
      'json-patch': 'fast-json-patch/src/json-patch-duplex',

      'laxar': 'laxar/dist/laxar',
      'laxar/laxar_testing': 'laxar/dist/laxar_testing',

      // LaxarJS dependencies:
      jjv: 'jjv/lib/jjv',
      jjve: 'jjve/jjve',
      'angular-route': 'angular-route/angular-route',
      'angular-sanitize': 'angular-sanitize/angular-sanitize',
      'angular-mocks': 'angular-mocks/angular-mocks',
      angular: 'angular/angular',

      // testing:
      jasmine: 'jasmine/lib/jasmine-core/jasmine',
      q_mock: 'q_mock/q',
      'jquery': 'jquery/dist/jquery'
   },
   packages: [
      {
         name: 'laxar-patterns',
         location: '.',
         main: 'laxar-patterns'
      }
   ],
   shim: {
      angular: {
         deps: [],
         exports: 'angular'
      },
      'angular-mocks': {
         deps: [ 'angular' ],
         init: function ( angular ) {
            'use strict';
            return angular.mock;
         }
      },
      'angular-route': {
         deps: [ 'angular' ],
         init: function ( angular ) {
            'use strict';
            return angular.route;
         }
      },
      'angular-sanitize': {
         deps: [ 'angular' ],
         init: function ( angular ) {
            'use strict';
            return angular;
         }
      },
      'json-patch': {
         exports: 'jsonpatch'
      }
   }
};
