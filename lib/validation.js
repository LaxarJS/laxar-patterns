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
import { assert, object } from 'laxar';

/**
 * Creates and returns an event resembling a successful validation result.
 *
 * @param {String} resource
 *    name of the validated resource
 * @param {...Object|String|String[]|Object[]} htmlMessages
 *    messages associated with the result. They should have the structure as described in the module
 *
 * @return {Object}
 *    the validation event
 */
function successEvent( resource, ...htmlMessages ) {
   return createEvent( resource, messagesFromArgs( htmlMessages ), 'SUCCESS' );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and returns an event resembling the result of a validation with errors.
 *
 * @param {String} resource
 *    name of the validated resource
 * @param {...Object|String|String[]|Object[]} htmlMessages
 *    messages associated with the result. They should have the structure as described in the module
 *
 * @return {Object}
 *    the validation event
 */
function errorEvent( resource, ...htmlMessages ) {
   return createEvent( resource, messagesFromArgs( htmlMessages ), 'ERROR' );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and returns a new handler for `validateRequest` events for a given context. It handles sending
 * of `willValidate` and `didValidate` events, including the output of the given `validator` function.
 *
 * @param {Object} context
 *    the context the handler should work with. It expects to find an `eventBus` property, with which
 *    it can do the event handling
 * @param {Object} configuration
 *    a laxarjs configuration, from which to get the default validation error message
 * @param {Object} log
 *    a laxarjs logger, to log validation errors
 *
 * @return {ValidationHandler}
 *    the validation handler instance for the given context
 */
function handlerFor( context, configuration, log ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );
   assert( configuration ).hasType( Object ).hasProperty( 'get' );
   assert( log ).hasType( Object ).hasProperty( 'error' );

   const eventBus = context.eventBus;

   /**
    * @name ValidationHandler
    */
   const api = {
      registerResourceFromFeature,
      registerResource
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

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
      assert( featurePath ).hasType( String ).isNotNull();
      assert( validator ).hasType( Function ).isNotNull();

      const options = object.options( optionalOptions, { isOptional: false } );

      const resource = object.path( context.features, `${featurePath}.resource`, null );
      if( resource === null && options.isOptional ) {
         return api;
      }
      assert( resource )
         .isNotNull( `Could not find resource configuration in features for "${featurePath}"` );

      return registerResource( resource, validator );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

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
    * found in the global configuration at `lib.laxar-patterns.validation.i18nHtmlExceptionMessage` as string
    * or i18n object. If it cannot be found, an empty string is send as message.
    *
    * Example:
    * ```js
    * validation.handlerFor( context, configuration, log, i18n )
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
      assert( resource ).hasType( String ).isNotNull();
      assert( validator ).hasType( Function ).isNotNull();

      eventBus.subscribe( `validateRequest.${resource}`, ( event, meta ) => {
         callValidator( resource, validator.bind( null, event, meta ) );
      } );
      return api;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // eslint-disable-next-line valid-jsdoc
   /** @private */
   function callValidator( resource, validator ) {
      eventBus.publish( `willValidate.${resource}`, { resource } );
      try {
         const returnValue = validator();

         Promise.resolve( returnValue )
            .then( result => {
               const wrap = _ => _ ? [ _ ] : null;
               const messages = Array.isArray( result ) ? result : wrap( result );
               const event = messages && messages.length > 0 ?
                  errorEvent( resource, messages ) :
                  successEvent( resource );

               eventBus.publish( `didValidate.${resource}.${event.outcome}`, event );
            } )
            .catch( handleError.bind( null, resource ) );
      }
      catch( err ) {
         handleError( resource, err );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   // eslint-disable-next-line valid-jsdoc
   /** @private */
   function handleError( resource, err ) {
      const logMessage = err && err.message ? err.message : err;
      log.error( 'Error handling validateRequest for resource "[0]": [1]', resource, logMessage );
      if( err ) {
         log.error( 'Stacktrace for previous error: [0]', err.stack || 'unavailable' );
      }

      const message = configuration.get( 'lib.laxar-patterns.validation.i18nHtmlExceptionMessage', '' );
      eventBus.publish( `didValidate.${resource}.ERROR`, errorEvent( resource, message ) );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return api;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/** @private */
function createEvent( resource, htmlMessages, outcome ) {
   const data = ( htmlMessages && htmlMessages.length ) ?
      htmlMessages.map( msg => {
         if( msg.htmlMessage && msg.level ) {
            return msg;
         }

         return {
            htmlMessage: msg,
            level: 'ERROR'
         };
      } ) : [];

   return { resource, data, outcome };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/** @private */
function messagesFromArgs( messageArguments ) {
   if( messageArguments && Array.isArray( messageArguments[ 0 ] ) ) {
      return messageArguments[ 0 ];
   }
   return messageArguments;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export {
   successEvent,
   errorEvent,
   handlerFor
};
