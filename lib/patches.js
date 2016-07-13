/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * Module for old-style LaxarJS patches used with the didUpdate event.
 *
 * @module patches
 */
import { object } from 'laxar';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Applies all patches given as mapping from object path to new value. If a path fragment doesn't exist
 * it is automatically inserted, using an array if the next key would be an integer. If a value is
 * appended to an array all values in between are set to `null`.
 *
 * This patch format cannot express all operations. Use `json.applyPatch` instead.
 *
 * @deprecated since v1.1
 *
 * @param {Object} obj
 *    the object to apply the patches on
 * @param {Object} patches
 *    the mapping of paths to new values
 */
function apply( obj, patches ) {
   let patchMap;
   if( Array.isArray( patches ) ) {
      patchMap = {};
      const arr = patches;
      arr.forEach( ( value, key ) => {
         if( value !== undefined ) {
            patchMap[ key ] = value;
         }
      } );
   }
   else {
      patchMap = patches;
   }

   // We sort the keys by length. Thus deeply nested attributes are not overwritten by patches applied to
   // one of their parents.
   Object.keys( patches )
      .sort( ( a, b ) => a.length - b.length )
      .forEach( path => object.setPath( obj, path, patches[ path ] ) );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a map of patches that describe the difference between to objects or arrays. Each entry is a
 * path mapped to the changed value. This map can be applied to another object using `applyPatches`.
 *
 * Properties that start with '$$' are ignored when creating patches, so that for example the $$hashCode
 * added by AngularJS ngRepeat is ignored.
 *
 * This patch format cannot express all operations. Use `json.createPatch` instead.
 *
 * @deprecated since v1.1
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
   const targetType = type( result );
   const subjectType = type( base );
   if( targetType !== 'array' && targetType !== 'object' ) {
      return null;
   }

   if( targetType !== subjectType ) {
      return object.deepClone( result );
   }
   const patches = {};

   function createPatchesRecursively( result, base, path ) {
      for( const key in result ) {
         if( result.hasOwnProperty( key ) && ( key.charAt( 0 ) !== '$' || key.charAt( 1 ) !== '$' ) ) {
            const val = result[ key ];
            const nextPath = path.concat( key );
            if( base[ key ] == null ) {
               patches[ nextPath.join( '.' ) ] = clean( object.deepClone( val ) );
            }
            else if( val && typeof val === 'object' ) {
               createPatchesRecursively( val, base[ key ], nextPath );
            }
            else if( val !== base[ key ] ) {
               patches[ nextPath.join( '.' ) ] = val;
            }
         }
      }

      for( const key in base ) {
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Merges two patch maps and returns the result. When properties exist in both patch maps, properties
 * within the second map overwrite those found within the first one.
 *
 * This patch format cannot express all operations.
 * Concatenate `json.createPatch` sequences instead of using this method.
 *
 * @deprecated since v1.1
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
   const resultMap = {};
   const firstKeys = Object.keys( first );
   const secondKeys = Object.keys( second );
   firstKeys.forEach( firstKey => {
      // we first collect all properties in first, that won't be overwritten by changes in the second
      // patch map.
      for( let i = 0; i < secondKeys.length; ++i ) {
         // thus completely matching keys and keys that are finer than one in the second map are ignored
         if( firstKey === secondKeys[ i ] || firstKey.indexOf( `${secondKeys[ i ]}.` ) === 0 ) {
            return;
         }
      }

      resultMap[ firstKey ] = first[ firstKey ];
   } );

   secondKeys.forEach( secondKey => {
      // we know only have keys that are absolutely finer than those in the first patch map OR affect a
      // completely different property that should be patched.
      for( let i = 0; i < firstKeys.length; ++i ) {
         const firstKey = firstKeys[ i ];
         const firstKeyAsPathFragment = `${firstKey}.`;
         if( secondKey.indexOf( firstKeyAsPathFragment ) === 0 ) {
            // here we found a finer change in the second patch map that needs to be merged into the more
            // general change of the first patch map
            const patch = {};
            patch[ secondKey.replace( firstKeyAsPathFragment, '' ) ] = second[ secondKey ];
            const change = first[ firstKey ];
            apply( change, patch );
            resultMap[ firstKey ] = change;

            return;
         }
      }

      resultMap[ secondKey ] = second[ secondKey ];
   } );

   return resultMap;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/** @private */
function type( object ) {
   if( object === null ) {
      return 'null';
   }
   if( object === undefined ) {
      return 'undefined';
   }

   const tmp = Object.prototype.toString.call( object ).split( ' ' )[ 1 ];
   if( !tmp ) {
      return undefined;
   }
   return tmp.substr( 0, tmp.length - 1 ).toLowerCase();
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/** @private */
function clean( object ) {
   if( object === null ) {
      return object;
   }
   for( const key in object ) {
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export {
   apply,
   create,
   merge
};
