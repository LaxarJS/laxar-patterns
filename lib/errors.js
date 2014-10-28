/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [ 'laxar' ], function( ax ) {
   'use strict';

   var assert = ax.assert;

   /**
    * Creates and returns a function to publish didEncounterError events related to a specific feature.
    * Generated events will not be delivered to the sender.
    *
    * @param {Object} scope the scope the publisher works on
    * @param {String=} featurePath The configuration path for (i18n) error-messages to publish.
    * @param {Object=} options An optional object with additional configuration:
    * @param {Function=} options.localizer A function such as `i18nHandler.localize` to prepare messages
    *
    * @returns {Function<[String, String, Object, cause]>}
    *    a publisher function with four arguments:
    *    - `code`: a generic code that identifies the failing operation (such as 'HTTP_PUT', 'HTTP_GET')
    *    - `messagePath`: to lookup a human-readable message under this publisher's feature configuration
    *    - `data`: additional information to be used for substituting in the message,
    *              should contain the fields `resource` and `location` if applicable.
    *    - `cause`: more diagnostic information on the error's cause, such as the underlying HTTP status code
    */
   function errorPublisherForFeature( scope, featurePath, options ) {
      assert( scope ).hasType( Object ).isNotNull();
      assert( scope.eventBus ).hasType( Object ).isNotNull();
      assert( options ).hasType( Object );
      var localizer = options && options.localizer;
      assert( localizer ).hasType( Function );

      var featureConfiguration = ax.object.path( scope.features, featurePath );
      assert( featureConfiguration ).hasType( Object ).isNotNull();
      return function( code, messagePath, data, cause ) {
         var rawMessage = ax.object.path( featureConfiguration, messagePath );
         assert( rawMessage ).isNotNull();
         data = data || {};
         scope.eventBus.publish( 'didEncounterError.' + code, {
            code: code,
            message: ax.string.format( localizer ? localizer( rawMessage ) : rawMessage, [], data ),
            data: data,
            cause: cause || {}
         }, { deliverToSender: false } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      errorPublisherForFeature: errorPublisherForFeature
   };

} );
