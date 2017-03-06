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
import { assert, object } from 'laxar';

/**
 * Obtain a handler which applies *didChangeLocale*-events to the given context.
 *
 * @param {AxContext} context
 *    the widget context to work on
 * @param {Object} i18n
 *    a laxarjs i18n service instance
 * @param {String} [optionalI18nPath]
 *    an optional path within the context (default: `'i18n'`) where to store i18n-state
 *
 * @return {I18nHandler}
 *    a handler which manages the i18n-object on the context, and which allows to register for locale
 *    changes, by topic or by feature
 */
export function handlerFor( context, i18n, optionalI18nPath ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );

   const i18nPath = optionalI18nPath || 'i18n';
   prepareContextI18n();

   const callbacksByLocale = {};

   function handleLocaleChangeEvent( event ) {
      const locale = event.locale;
      const tags = object.path( context, i18nPath ).tags;
      const previousTag = tags[ locale ];
      if( previousTag !== event.languageTag ) {
         tags[ locale ] = event.languageTag;
         callbacksByLocale[ locale ].forEach( cb => cb( event, previousTag ) );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @name I18nHandler
    * @constructor
    * @private
    */
   const handler = {

      /**
       * Manages changes to the given locale(s).
       *
       * @param {String|String[]} possibleLocales
       *    zero, one or more locale topics to manage
       * @param {Object} [optionalOptions]
       *    an optional configuration object
       * @param {Function|Function[]} [optionalOptions.onChange]
       *    a function or a list of functions to call whenever one of the locales changes.
       *    It receives the event which triggered the change as the first argument, and the previous
       *    language-tag as the second argument
       *
       * @return {Object}
       *    this instance for chaining
       *
       * @memberof I18nHandler
       */
      registerLocale( possibleLocales, optionalOptions ) {
         let locales = possibleLocales;
         if( !Array.isArray( possibleLocales ) ) {
            locales = possibleLocales ? [ possibleLocales ] : [];
         }
         locales.forEach( locale => {
            if( !callbacksByLocale[ locale ] ) {
               callbacksByLocale[ locale ] = [];
               context.eventBus.subscribe( `didChangeLocale.${locale}`, handleLocaleChangeEvent );
            }
            const onChange = ( optionalOptions || {} ).onChange;
            if( onChange ) {
               callbacksByLocale[ locale ] = callbacksByLocale[ locale ].concat(
                  Array.isArray( onChange ) ? onChange : [ onChange ]
               );
            }
         } );
         return handler;
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Looks for the given feature path within the feature configuration and registers for changes to the
       * corresponding locale. If there is a key `locale` at the given feature, that entry is used.
       * Otherwise, the entire configuration path has to be specified.
       *
       * @param {String} featurePath
       *    a feature path for the current context
       * @param {Object} [optionalOptions]
       *    an optional configuration object
       *
       * @return {Object}
       *    this instance for chaining
       *
       * @memberof I18nHandler
       */
      registerLocaleFromFeature( featurePath, optionalOptions ) {
         const entry = object.path( context.features, featurePath );
         return handler.registerLocale( entry.locale || entry, optionalOptions || {} );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      contextLocaleFromFeature( featurePath, options ) {
         const entry = object.path( context.features, featurePath );
         object.path( context, i18nPath ).locale = entry.locale || entry;
         return handler.registerLocale( object.path( context, i18nPath ).locale, options || {} );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      localizer( fallback ) {
         const model = object.path( context, i18nPath );
         function partial( i18nValue ) {
            if( typeof i18nValue === 'string' ) { return i18nValue; }
            const tag = model.tags[ model.locale ];
            return tag ? i18n.localizer( tag, fallback )( i18nValue ) : fallback;
         }
         partial.format = ( ...args ) =>
            i18n.localizer( model.tags[ model.locale ] ).format( ...args );
         return partial;
      }

   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function prepareContextI18n() {
      let result = object.path( context, i18nPath );
      if( !result ) {
         result = {};
         object.setPath( context, i18nPath, result );
      }
      if( !result.tags ) {
         result.tags = {};
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return handler;
}
