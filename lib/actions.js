/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'laxar',
   'underscore'
], function( ax, _ ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function handlerFor( scope ) {
      return new ActionHandler( scope );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function ActionHandler( scope ) {
      this.scope_ = scope;
   }

   ActionHandler.prototype.registerAction = function registerAction() {
      throw new Error( 'implement me' );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      handlerFor: handlerFor
   };

} );