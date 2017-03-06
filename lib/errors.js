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
 * Creates and returns a function to publish *didEncounterError* events related to a specific feature.
 * Generated events will not be delivered to the sender.
 *
 * The returned publisher function takes these arguments:
 * - `code` (`String`): a generic code that identifies the failing operation (such as `'HTTP_PUT'`,
 *   `'HTTP_GET'` ...)
 * - `messagePath` (`String`): path to the message (or i18n message object) located under
 *   ```context.features.${featurePath}``` to send along with the error event
 * - `data` (`any`): additional information to be used for substituting in the message. It should contain the
 *   fields `resource` and `location` if applicable.
 * - `cause` (`any`): more diagnostic information on the error's cause, such as the underlying HTTP status
 *   code
 *
 * Example:
 *
 * Possible feature configuration:
 * ```json
 * {
 *    "features": {
 *       "myFeatures": {
 *          "failureMessage": "Something really bad happened!"
 *       }
 *    }
 * }
 * ```
 * Creating and using a publisher:
 * ```js
 * const publisher = errors.errorPublisherForFeature( context, 'myFeature' );
 * // ...
 * publisher( 'HTTP_GET', 'failureMessage', {
 *    resource: 'user',
 *    moreInfo: 'Probably under DoS attack'
 * } );
 * ```
 * @param {AxContext} context
 *    the widget context to work on
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
export function errorPublisherForFeature( context, featurePath, options ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );
   assert( options ).hasType( Object );

   const localizer = options && options.localizer;
   assert( localizer ).hasType( Function );

   const featureConfiguration = object.path( context.features, featurePath );
   assert( featureConfiguration ).hasType( Object ).isNotNull();

   return ( code, messagePath, data = {}, cause = {} ) => {
      const rawMessage = object.path( featureConfiguration, messagePath );
      assert( rawMessage ).isNotNull();

      const message = string.format( localizer ? localizer( rawMessage ) : rawMessage, [], data );
      const event = { code, message, data, cause };
      context.eventBus.publish( `didEncounterError.${code}`, event, { deliverToSender: false } );
   };
}
