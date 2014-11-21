/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'laxar',
   'json-patch'
], function( ax, jsonPatch, undefined ) {
   'use strict';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Lookup a nested object using an rfc-6901 json pointer.
    *
    * @param {Object|Array=} object
    *    the object in which to lookup an entry
    * @param {String} pointer
    *    a valid JSON pointer conforming to rfc-6901
    * @param {*} fallback
    *    a value to return if the JSON pointer does not point to any value within the object
    *
    * @return {*}
    *    the value found at the JSON pointer, or the fallback value
    */
   function getPointer( object, pointer, fallback ) {
      var keys = pointer.split( '/' );
      var len = keys.length;
      var usesEscapes = pointer.indexOf( '~' ) !== -1;

      for( var i = 1; i < len; ++i ) {
         if( object === undefined ) {
            return fallback;
         }
         if( Array.isArray( object ) ) {
            var index = parseInt( keys[ i ], 10 );
            object = object[ index ];
         }
         else {
            var key = keys[ i ];
            if( usesEscapes ) {
               // unescape masked chars ('/', '~'):
               key = key.replace( /~1/g, '/' ).replace( /~0/g, '~' );
            }
            object = object[ key ];
         }
      }
      return object === undefined ? fallback : object;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Set a nested item within a structure using an rfc-6901 json pointer.
    * Missing containers along the path will be created (using ax.object.path).
    * The object is modified in-place.
    *
    * JSON pointer segments of the type '/-' (for appending to an array) are not supported.
    * You can use a single JSON patch 'add' operation to achieve the desired effect.
    *
    * @param {Object|Array} object
    *    the object in which to lookup an entry
    * @param {String} pointer
    *    a valid JSON pointer conforming to rfc-6901
    * @param {*} value
    *    the value to set at the place indicated by the pointer
    *
    * @return {Object|Array}
    *    the modified object (for chaining)
    */
   function setPointer( object, pointer, value ) {
      var path = pointerToPath( pointer );
      return ax.object.setPath( object, path, value );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Transform an rfc-6901 JSON pointer into a laxar object path.
    *
    * @param {String} pointer
    *    a valid JSON pointer conforming to rfc-6901
    *
    * @return {String}
    *    a path that can be used with ax.object.path
    */
   function pointerToPath( pointer ) {
      var keys = pointer.split( '/' ).slice( 1 );
      if( pointer.indexOf( '~' ) !== -1 ) {
         var len = keys.length;
         for( var i = 0; i < len; ++i ) {
            keys[ i ] = keys[ i ].replace( /~1/g, '/' ).replace( /~0/g, '~' );
         }
      }
      return keys.join( '.' );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Transform a laxar object path into an rfc-6901 JSON pointer.
    *
    * @param {String} path
    *    a LaxarJS object path where segments are separated using '.'
    *
    * @return {String}
    *    a valid JSON pointer conforming to rfc-6901
    */
   function pathToPointer( path ) {
      if( path === '' ) {
         return '';
      }
      var keys = path.split( '.' );
      if( path.indexOf( '/' ) !== -1 || path.indexOf( '~' ) !== -1 ) {
         var len = keys.length;
         for( var i = 0; i < len; ++i ) {
            keys[ i ] = keys[ i ].replace( /~/g, '~0' ).replace( /\//g, '~1' );
         }
      }
      return '/' + keys.join( '/' );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Calls fast-json-patch to apply the given rfc-6902 JSON patch sequence in-place.
    * If the patch sequence fails to apply, the behavior is undefined.
    *
    * @param {Object|Array} object
    *    the object to patch (in-place)
    *
    * @param {Array} patches
    *    a sequence of patches as defined by rfc-6902
    */
   function applyPatch( object, patches ) {
      jsonPatch.apply( object, patches );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      // rfc-6901 helpers
      getPointer: getPointer,
      setPointer: setPointer,
      pointerToPath: pointerToPath,
      pathToPointer: pathToPointer,
      // rfc-6902 helpers
      applyPatch: applyPatch,
      createPatch: jsonPatch.compare
   };

} );
