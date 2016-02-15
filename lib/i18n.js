/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *didChangeLocale* events.
 *
 * @module i18n
 */
import * as ax from 'laxar';

/**
 * Obtain a handler which applies didChangeLocale-events to the given scope.
 *
 * @param {Object} scope
 *    the scope instance for which i18n-state should be managed
 * @param {String} [optionalI18nPath]
 *    an optional path within the scope (default: `'i18n'`) where to store i18n-state
 *
 * @return {I18nHandler}
 *    a handler which manages the i18n-object on the scope, and which allows to register for locale
 *    changes, by topic or by feature
 */
function handlerFor( scope, optionalI18nPath ) {
   var i18nPath = optionalI18nPath || 'i18n';
   prepareScopeI18n();

   var callbacksByLocale = {};

   function handleLocaleChangeEvent( event ) {
      var locale = event.locale;
      var tags = ax.object.path( scope, i18nPath ).tags;
      var previousTag = tags[ locale ];
      if( previousTag !== event.languageTag ) {
         tags[ locale ] = event.languageTag;
         callbacksByLocale[ locale ].forEach( function( cb ) {
            cb( event, previousTag );
         } );
      }
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @name I18nHandler
    * @constructor
    * @private
    */
   var handler = {

      /**
       * Manage changes to the given locale(s).
       *
       * @param {String|String[]} possibleLocales
       *    zero, one or more locale topics to manage
       * @param {Object} [optionalOptions]
       *    an optional configuration object
       * @param {Function|Function[]} optionalOptions.onChange
       *    a function or a list of functions to call whenever one of the locales changes
       *    It receives the event which triggered the change as the first argument, and the previous
       *    language-tag as the second argument
       *
       * @return {Object}
       *    this instance for chaining
       *
       * @memberOf I18nHandler
       */
      registerLocale: function( possibleLocales, optionalOptions ) {
         var locales = possibleLocales;
         if( !Array.isArray( possibleLocales ) ) {
            locales = possibleLocales ? [ possibleLocales ] : [];
         }
         locales.forEach( function( locale ) {
            if( !callbacksByLocale[ locale ] ) {
               callbacksByLocale[ locale ] = [];
               scope.eventBus.subscribe( 'didChangeLocale.' + locale, handleLocaleChangeEvent );
            }
            var onChange = ( optionalOptions || {} ).onChange;
            if( onChange ) {
               callbacksByLocale[ locale ] = callbacksByLocale[ locale ].concat(
                  Array.isArray( onChange ) ? onChange : [ onChange ]
               );
            }

         } );
         return handler;
      },

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Look for the given feature path within the feature configuration and register for changes to the
       * corresponding locale. If there is a key 'locale' at the given feature, that entry is used.
       * Otherwise, the entire configuration path has to be specified.
       *
       * @param {String} featurePath  A feature path for the current scope.
       * @param {Object} [optionalOptions]  An optional configuration object.
       *
       * @return {Object}
       *    this instance for chaining
       *
       * @memberOf I18nHandler
       */
      registerLocaleFromFeature: function( featurePath, optionalOptions ) {
         var entry = ax.object.path( scope.features, featurePath );
         return handler.registerLocale( entry.locale || entry, optionalOptions || {} );
      },

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      scopeLocaleFromFeature: function( featurePath, options ) {
         var entry = ax.object.path( scope.features, featurePath );
         scope.i18n.locale = entry.locale || entry;
         return handler.registerLocale( scope.i18n.locale, options || {} );
      },

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      localizer: function( fallback ) {
         var model = ax.object.path( scope, i18nPath );
         function partial( i18nValue ) {
            if( typeof i18nValue === 'string' ) { return i18nValue; }
            var tag = model.tags[ model.locale ];
            return tag ? ax.i18n.localizer( tag, fallback )( i18nValue ) : fallback;
         }
         partial.format = function( i18nValue, substitutions ) {
            var i18nLocalizer = ax.i18n.localizer( model.tags[ model.locale ] );
            return i18nLocalizer.format.apply( i18nLocalizer, arguments );
         };
         return partial;
      }

   };

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   function prepareScopeI18n() {
      var result = ax.object.path( scope, i18nPath );
      if( !result ) {
         result = {};
         ax.object.setPath( scope, i18nPath, result );
      }
      if( !result.tags ) {
         result.tags = {};
      }
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   return handler;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

export {
   handlerFor
};
