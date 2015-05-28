/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for creating event objects to be used with *didValidate* events.
 *
 * Validation messages can have one of the following structures:
 * - A simple html message object (locale to string mapping). It will get a default level of *ERROR*.
 * - A html message object as required by the messages widget consisting of a html message object under the
 *   key *htmlMessage* and a level under the key *level*.
 *
 * @module validation
 */
define( [], function() {
   'use strict';

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

   return {

      /**
       * Creates and returns an event resembling a successful validation result.
       *
       * @param {String} resource
       *    name of the validated resource
       * @param {Object[]|...Object} htmlMessages
       *    messages associated with the result. They should have the structure as described in the module
       *
       * @return {Object}
       *    the validation event
       */
      successEvent: function( resource, htmlMessages ) {
         return createEvent( resource, messagesFromArgs( htmlMessages, arguments ), 'SUCCESS' );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Creates and returns an event resembling the result of a validation with errors.
       *
       * @param {String} resource name of the validated resource
       * @param {Object[]|...Object} htmlMessages
       *    messages associated with the result. They should have the structure as described in the module
       *
       * @return {Object}
       *    the validation event
       */
      errorEvent: function( resource, htmlMessages ) {
         return createEvent( resource, messagesFromArgs( htmlMessages, arguments ), 'ERROR' );
      }

   };

} );
