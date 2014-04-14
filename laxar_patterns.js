/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   './lib/actions',
   './lib/flags',
   './lib/i18n',
   './lib/patches',
   './lib/validation',
   './lib/resources'
], function( actions, flags, i18n, patches, validation, resources ) {
   'use strict';

   return {
      actions: actions,
      flags: flags,
      i18n: i18n,
      patches: patches,
      validation: validation,
      resources: resources
   };

} );
