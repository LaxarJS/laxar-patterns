/**
 * Copyright 2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   './lib/actions',
   './lib/errors',
   './lib/flags',
   './lib/i18n',
   './lib/json',
   './lib/patches',
   './lib/resources',
   './lib/validation',
   './lib/visibility'
], function( actions, errors, flags, i18n, json, patches, resources, validation, visibility ) {
   'use strict';

   return {
      actions: actions,
      errors: errors,
      flags: flags,
      i18n: i18n,
      json: json,
      patches: patches,
      resources: resources,
      validation: validation,
      visibility: visibility
   };

} );
