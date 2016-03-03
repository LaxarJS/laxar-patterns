/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *didEncounterError* events.
 *
 * @module errors
 */
import { assert, object, string } from 'laxar';


/**
 * Creates and returns a function to publish didEncounterError events related to a specific feature.
 * Generated events will not be delivered to the sender.
 *
 * The returned publisher function takes these arguments:
 * - `code`: a generic code that identifies the failing operation (such as 'HTTP_PUT', 'HTTP_GET')
 * - `messagePath`: to lookup a human-readable message under this publisher's feature configuration
 * - `data`: additional information to be used for substituting in the message, It should contain the
 *   fields `resource` and `location` if applicable.
 * - `cause`: more diagnostic information on the error's cause, such as the underlying HTTP status code
 *
 * @param {Object} scope
 *    the scope the publisher works on
 * @param {String} featurePath
 *    the configuration path for (i18n) error-messages to publish
 * @param {Object} [options]
 *    an optional object with additional configuration
 * @param {Function} options.localizer
 *    a function such as `i18nHandler.localize` to prepare messages
 *
 * @return {Function}
 *    a publisher function with four arguments as described above
 */
function errorPublisherForFeature( scope, featurePath, options ) {
   assert( scope ).hasType( Object ).isNotNull();
   assert( scope.eventBus ).hasType( Object ).isNotNull();
   assert( options ).hasType( Object );

   const localizer = options && options.localizer;
   assert( localizer ).hasType( Function );

   const featureConfiguration = object.path( scope.features, featurePath );
   assert( featureConfiguration ).hasType( Object ).isNotNull();

   return ( code, messagePath, data, cause ) => {
      const rawMessage = object.path( featureConfiguration, messagePath );
      assert( rawMessage ).isNotNull();

      data = data || {};
      scope.eventBus.publish( `didEncounterError.${code}`, {
         code: code,
         message: string.format( localizer ? localizer( rawMessage ) : rawMessage, [], data ),
         data: data,
         cause: cause || {}
      }, { deliverToSender: false } );
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export {
   errorPublisherForFeature
};
