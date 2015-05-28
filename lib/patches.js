/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * Module for old-style LaxarJS patches used with the didUpdate event.
 *
 * @module patches
 */
define( [
   'laxar'
], function( ax ) {
   'use strict';

   var deepClone = ax.object.deepClone;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Applies all patches given as mapping from object path to new value. If a path fragment doesn't exist
    * it is automatically inserted, using an array if the next key would be an integer. If a value is
    * appended to an array all values in between are set to `null`.
    *
    * @param {Object} obj
    *    the object to apply the patches on
    * @param {Object} patchMap
    *    the mapping of paths to new values
    */
   function apply( obj, patchMap ) {
      if( Array.isArray( patchMap ) ) {
         var arr = patchMap;
         patchMap = {};
         arr.forEach( function( value, key ) {
            if( typeof( value ) !== 'undefined' ) {
               patchMap[ key ] = value;
            }
         } );
      }

      // We sort the keys by length. Thus deeply nested attributes are not overwritten by patches applied to
      // one of their parents.
      Object.keys( patchMap )
         .sort( function( a, b ) { return a.length - b.length; } )
         .forEach( function( path ) {
            ax.object.setPath( obj, path, patchMap[ path ] );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates a map of patches that describe the difference between to objects or arrays. Each entry is a
    * path mapped to the changed value. This map can be applied to another object using `applyPatches`.
    *
    * Properties that start with '$$' are ignored when creating patches, so that for example the $$hashCode
    * added by AngularJS ngRepeat is ignored.
    *
    * @param {Object} result
    *    the resulting object the patch map should establish
    * @param {Object} base
    *    the object used to base the patches upon
    *
    * @return {Object}
    *    the mapping of path to patch-value
    */
   function create( result, base ) {
      var targetType = type( result );
      var subjectType = type( base );
      if( targetType !== 'array' && targetType !== 'object' ) {
         return null;
      }

      if( targetType !== subjectType ) {
         return deepClone( result );
      }
      var patches = {};

      function createPatchesRecursively( result, base, path ) {
         var key;
         for( key in result ) {
            if( result.hasOwnProperty( key ) && ( key.charAt( 0 ) !== '$' || key.charAt( 1 ) !== '$' ) ) {
               var val = result[ key ];
               var nextPath = path.concat( key );
               if( base[ key ] == null ) {
                  patches[ nextPath.join( '.' ) ] = clean( deepClone( val ) );
               }
               else {
                  if( val && typeof val === 'object' ) {
                     createPatchesRecursively( val, base[ key ], nextPath );
                  }
                  else if( val !== base[ key ] ) {
                     patches[ nextPath.join( '.' ) ] = val;
                  }
               }
            }
         }

         for( key in base ) {
            if( base.hasOwnProperty( key ) ) {
               if( !( key in result ) ) {
                  patches[ path.concat( key ).join( '.' ) ] = null;
               }
            }
         }
      }
      createPatchesRecursively( result, base, [] );

      return patches;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Merges two patch maps and returns the result. When properties exist in both patch maps, properties
    * within the second map overwrite those found within the first one.
    *
    * @param {Object} first
    *    first map to merge
    * @param {Object} second
    *    second map to merge
    *
    * @return {Object}
    *    the result of the merging
    */
   function merge( first, second ) {
      var resultMap = {};
      var firstKeys = Object.keys( first );
      var secondKeys = Object.keys( second );
      firstKeys.forEach( function( firstKey ) {
         // we first collect all properties in first, that won't be overwritten by changes in the second
         // patch map.
         for( var i = 0; i < secondKeys.length; ++i ) {
            // thus completely matching keys and keys that are finer than one in the second map are ignored
            if( firstKey === secondKeys[ i ] || firstKey.indexOf( secondKeys[ i ] + '.' ) === 0 ) {
               return;
            }
         }

         resultMap[ firstKey ] = first[ firstKey ];
      } );

      secondKeys.forEach( function( secondKey ) {
         // we know only have keys that are absolutely finer than those in the first patch map OR affect a
         // completely different property that should be patched.
         for( var i = 0; i < firstKeys.length; ++i ) {
            var firstKey = firstKeys[ i ];
            var firstKeyAsPathFragment = firstKey + '.';
            if( secondKey.indexOf( firstKeyAsPathFragment ) === 0 ) {
               // here we found a finer change in the second patch map that needs to be merged into the more
               // general change of the first patch map
               var patch = {};
               patch[ secondKey.replace( firstKeyAsPathFragment, '' ) ] = second[ secondKey ];
               var change = first[ firstKey ];
               apply( change, patch );
               resultMap[ firstKey ] = change;

               return;
            }
         }

         resultMap[ secondKey ] = second[ secondKey ];
      } );

      return resultMap;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /** @private */
   function type( object ) {
      if( object === null ) {
         return 'null';
      }
      if( typeof object === 'undefined' ) {
         return 'undefined';
      }

      var tmp = Object.prototype.toString.call( object ).split( ' ' )[1];
      if( !tmp ) {
         return undefined;
      }
      return tmp.substr( 0, tmp.length - 1 ).toLowerCase();
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /** @private */
   function clean( object ) {
      if( object === null ) {
         return object;
      }
      for( var key in object ) {
         if( object.hasOwnProperty( key ) ) {
            if( key.charAt( 0 ) === '$' && key.charAt( 1 ) === '$' ) {
               delete object[ key ];
            }
            else if( typeof object[ key ] === 'object' ) {
               clean( object[ key ] );
            }
         }
      }
      return object;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      apply: apply,

      create: create,

      merge: merge

   };

} );
