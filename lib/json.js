/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for dealing with patches for JSON structures, specifically regarding
 * [RFC 6901](https://tools.ietf.org/html/rfc6901) and [RFC 6902](https://tools.ietf.org/html/rfc6902).
 *
 * @module json
 */
import jsonPatch from 'fast-json-patch';
import * as ax from 'laxar';

/**
 * Lookup a nested object using an rfc-6901 JSON pointer.
 *
 * @param {Object|Array} object
 *    the object in which to lookup an entry
 * @param {String} pointer
 *    a valid JSON pointer conforming to rfc-6901
 * @param {*} [fallback]
 *    a value to return if the JSON pointer does not point to any value within the object
 *
 * @return {*}
 *    the value found at the JSON pointer, or the fallback value
 */
export function getPointer( object, pointer, fallback ) {
   const keys = pointer.split( '/' );
   const len = keys.length;
   const usesEscapes = pointer.indexOf( '~' ) !== -1;

   let subTree = object;
   for( let i = 1; i < len; ++i ) {
      if( object === undefined ) {
         return fallback;
      }

      if( Array.isArray( object ) ) {
         const index = parseInt( keys[ i ], 10 );
         subTree = subTree[ index ];
      }
      else {
         let key = keys[ i ];
         if( usesEscapes ) {
            // unescape masked chars ('/', '~'):
            key = key.replace( /~1/g, '/' ).replace( /~0/g, '~' );
         }
         subTree = subTree[ key ];
      }
   }
   return subTree === undefined ? fallback : subTree;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Set a nested item within a structure using an rfc-6901 JSON pointer. Missing containers along the path
 * will be created (using laxar.object.setPath). The object is modified in-place.
 *
 * JSON pointer segments of the type '/-' (for appending to an array) are not supported. You can use a
 * single JSON patch 'add' operation to achieve the desired effect.
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
export function setPointer( object, pointer, value ) {
   const path = pointerToPath( pointer );
   return ax.object.setPath( object, path, value );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Transform an rfc-6901 JSON pointer into a laxar object path.
 *
 * @param {String} pointer
 *    a valid JSON pointer conforming to rfc-6901
 *
 * @return {String}
 *    a path that can be used with `laxar.object.path`
 */
export function pointerToPath( pointer ) {
   const keys = pointer.split( '/' ).slice( 1 );
   if( pointer.indexOf( '~' ) !== -1 ) {
      const len = keys.length;
      for( let i = 0; i < len; ++i ) {
         keys[ i ] = keys[ i ].replace( /~1/g, '/' ).replace( /~0/g, '~' );
      }
   }
   return keys.join( '.' );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Transform a laxar object path into an rfc-6901 JSON pointer.
 *
 * @param {String} path
 *    a LaxarJS object path where segments are separated using '.'
 *
 * @return {String}
 *    a valid JSON pointer conforming to rfc-6901
 */
export function pathToPointer( path ) {
   if( path === '' ) {
      return '';
   }
   const keys = path.split( '.' );
   if( path.indexOf( '/' ) !== -1 || path.indexOf( '~' ) !== -1 ) {
      const len = keys.length;
      for( let i = 0; i < len; ++i ) {
         keys[ i ] = keys[ i ].replace( /~/g, '~0' ).replace( /\//g, '~1' );
      }
   }
   const relativePointer = keys.join( '/' );
   return `/${relativePointer}`;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Calls fast-json-patch to apply the given rfc-6902 JSON patch sequence in-place. If the patch sequence
 * fails to apply, the behavior is undefined.
 *
 * @param {Object|Array} object
 *    the object to patch (in-place)
 * @param {Array} patches
 *    a sequence of patches as defined by rfc-6902
 */
export function applyPatch( object, patches ) {
   jsonPatch.apply( object, patches );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Calls fast-json-patch to create a rfc-6902 conform JSON patch sequence.
 *
 * @param {Object|Array} fromState
 *    the state on which to base the list of patches
 * @param {Object|Array} toState
 *    the target state: the desired result of applying the newly created patches to the `fromState`
 *
 * @return {Array}
 *    a sequence of patches as defined by rfc-6902
 */
export function createPatch( fromState, toState ) {
   return jsonPatch.compare( fromState, toState );
}
