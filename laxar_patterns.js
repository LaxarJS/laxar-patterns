/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   './lib/actions',
   './lib/errors',
   './lib/flags',
   './lib/i18n',
   './lib/patches',
   './lib/validation',
   './lib/resources'
], function( actions, errors, flags, i18n, patches, validation, resources ) {
   'use strict';

   return {
      actions: actions,
      errors: errors,
      flags: flags,
      i18n: i18n,
      patches: patches,
      resources: resources,
      validation: validation
   };

} );
