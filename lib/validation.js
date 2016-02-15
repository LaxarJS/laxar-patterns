/**
 * Copyright 2014-2015 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *validateRequest*, *willValidate* and
 * *didValidate* events.
 *
 * Validation messages can have one of the following structures:
 * - A simple html message object (locale to string mapping). It will get a default level of *ERROR*.
 * - A html message object as required by the messages widget consisting of a html message object under the
 *   key *htmlMessage* and a level under the key *level*.
 *
 * @module validation
 */
import * as ax from 'laxar';

/**
 * Creates and returns an event resembling a successful validation result.
 *
 * @param {String} resource
 *    name of the validated resource
 * @param {Object[]|...Object|String[]|...String} htmlMessages
 *    messages associated with the result. They should have the structure as described in the module
 *
 * @return {Object}
 *    the validation event
 */
function successEvent( resource, htmlMessages ) {
   return createEvent( resource, messagesFromArgs( htmlMessages, arguments ), 'SUCCESS' );
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and returns an event resembling the result of a validation with errors.
 *
 * @param {String} resource
 *    name of the validated resource
 * @param {Object[]|...Object|String[]|...String} htmlMessages
 *    messages associated with the result. They should have the structure as described in the module
 *
 * @return {Object}
 *    the validation event
 */
function errorEvent( resource, htmlMessages ) {
   return createEvent( resource, messagesFromArgs( htmlMessages, arguments ), 'ERROR' );
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and returns a new handler for `validateRequest` events for a given context. It handles sending
 * of `willValidate` and `didValidate` events, including the output of the given `validator` function.
 *
 * @param {Object} context
 *    the context the handler should work with. It expects to find an `eventBus` property, with which
 *    it can do the event handling
 *
 * @return {ValidationHandler}
 *    the validation handler instance for the given context
 */
function handlerFor( context ) {
   ax.assert( context ).hasType( Object ).hasProperty( 'eventBus' );

   var eventBus = context.eventBus;

   /**
    * @name ValidationHandler
    */
   var api = {
      registerResourceFromFeature: registerResourceFromFeature,
      registerResource: registerResource
   };

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers a validator for `validateRequest` events for a resource configured under the given feature.
    * It is assumed that the given feature has a `resource` property with the name of the resource to
    * validate. If the property is not found, an assertion will fail. If on the other hand the option
    * `isOptional` is given as `true`, this is ignored and nothing good or bad happens.
    *
    * Apart from that this function works just like {@link ValidationHandler#registerResource}.
    *
    * Example:
    * Consider the following configuration for a widget:
    * ```json
    * {
    *    "features": {
    *       "amount": {
    *          "resource": "theAmount"
    *       }
    *    }
    * }
    * ```
    * An example using that would be:
    * ```js
    * validation.handlerFor( context )
    *    .registerResourceFromFeature( 'amount', function( event, meta ) {
    *       if( isAmountValid() ) {
    *          return null;
    *       }
    *       return 'The given amount is not valid';
    *    } );
    * ```
    *
    * @param {String} featurePath
    *    the feature to read the resource to validate from
    * @param {Function} validator
    *    the validator function called upon `validateRequest` for the given resource
    * @param {Object} [optionalOptions]
    *    options to use
    * @param {Boolean} optionalOptions.isOptional
    *    if `true` a non-configured feature is simply ignored. Otherwise this results in an error
    *    (default is `false`)
    *
    * @return {ValidationHandler}
    *    this instance for chaining
    *
    * @memberOf ValidationHandler
    */
   function registerResourceFromFeature( featurePath, validator, optionalOptions ) {
      ax.assert( featurePath ).hasType( String ).isNotNull();
      ax.assert( validator ).hasType( Function ).isNotNull();

      var options = ax.object.options( optionalOptions, { isOptional: false } );

      var resource = ax.object.path( context.features, featurePath + '.resource', null );
      if( resource === null && options.isOptional ) {
         return api;
      }
      ax.assert( resource )
         .isNotNull( 'Could not find resource configuration in features for "' + featurePath + '"' );

      return registerResource( resource, validator );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers a validator for `validateRequest` events for the given resource.
    *
    * The validator must be a function, that handles the actual validation necessary for the resource. The
    * validation result is always signaled through one or more generated error messages or the absence of
    * these messages. So valid results may be a string, an i18n object, an array of the former, `null` or
    * an empty array. `null` and an empty array signal a successful validation.
    *
    * The validator receives the event object for the `validateRequest` event and its according `meta` object.
    *
    * The way these messages are returned by the validator may be one of two ways, depending on the nature
    * of the validation:
    *
    * - if the validation can be handled synchronously, the result should simply be returned directly
    * - in case the validation is asynchronous, a promise must be returned, which must be resolved with the
    *   same kind of values as for the synchronous case
    *
    * If the validator throws an error or the promise is rejected, this is treated as a failed validation.
    * Since this is due to a programming error, the error or rejection cause will be logged and a
    * configurable message will instead be send in the `didValidate` event. The message is assumed to be
    * found in the global configuration under the path `lib.laxar-patterns.validation.i18nHtmlExceptionMessage`
    * as string or i18n object. If it cannot be found, an empty string is send as message.
    *
    * Example:
    * ```js
    * validation.handlerFor( context )
    *    .registerResource( 'theAmount', function( event, meta ) {
    *       return context.resources.theAmount > 1000;
    *    } )
    *    .registerResource( 'currentUser', function( event, meta ) {
    *       return fetchUserValidityRules()
    *          .then( function( rules ) {
    *             return context.resources.currentUser.meets( rules );
    *          } )
    *          .then( function( valid ) {
    *             return valid ? null : 'The current user isn\'t valid for some reason. Do something!';
    *          } );
    *    } );
    * ```
    *
    * @param {String} resource
    *    the resource to validate
    * @param {Function} validator
    *    the validator function called upon `validateRequest` for the given resource
    *
    * @return {ValidationHandler}
    *    this instance for chaining
    *
    * @memberOf ValidationHandler
    */
   function registerResource( resource, validator ) {
      ax.assert( resource ).hasType( String ).isNotNull();
      ax.assert( validator ).hasType( Function ).isNotNull();

      eventBus.subscribe( 'validateRequest.' + resource, function( event, meta ) {
         callValidator( resource, validator.bind( null, event, meta ) );
      } );
      return api;
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * @private
    */
   function callValidator( resource, validator ) {
      eventBus.publish( 'willValidate.' + resource, { resource: resource }  );
      try {
         var returnValue = validator();

         q().when( returnValue )
            .then( function( result ) {
               var messages = Array.isArray( result ) ? result : ( result ? [ result ] : null );
               var event = messages && messages.length > 0 ?
                  errorEvent( resource, messages ) : successEvent( resource );

               eventBus.publish( 'didValidate.' + resource + '.' + event.outcome, event );
            } )
            .catch( handleError.bind( null, resource ) );
      }
      catch( err ) {
         handleError( resource, err );
      }
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * @private
    */
   function handleError( resource, err ) {
      var logMessage = err && err.message ? err.message : err;
      ax.log.error( 'Error handling validateRequest for resource "[0]": [1]', resource, logMessage );
      if( err ) {
         ax.log.error( 'Stacktrace for previous error: [0]', err.stack || 'unavailable' );
      }

      var message = ax.configuration.get( 'lib.laxar-patterns.validation.i18nHtmlExceptionMessage', '' );
      eventBus.publish( 'didValidate.' + resource + '.ERROR', errorEvent( resource, message ) );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   return api;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @private
 */
function createEvent( resource, htmlMessages, outcome ) {
   var data = [];
   if( htmlMessages && htmlMessages.length ) {
      data = htmlMessages.map( function( msg ) {
         if( msg.htmlMessage && msg.level ) {
            return msg;
         }

         return {
            htmlMessage: msg,
            level: 'ERROR'
         };
      } );
   }

   return {
      resource: resource,
      data: data,
      outcome: outcome
   };
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @private
 */
function messagesFromArgs( messages, args ) {
   if( Array.isArray( messages ) ) {
      return messages;
   }
   return [].slice.call( args, 1 );
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

function q() {
   return ax._tooling.provideQ();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

export {
   successEvent,
   errorEvent,
   handlerFor
};
