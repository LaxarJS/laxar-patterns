/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import * as errors from '../errors';
import { create as createEventBusMock } from 'laxar/lib/testing/event_bus_mock';

describe( 'A standard didEncounterError-event publisher', () => {

   var publisher;
   var scope;
   beforeEach( () => {
      scope = {
         eventBus: createEventBusMock(),
         features: {
            superFeature: {
               superAttribute: {
                  failureMessage: 'Failed to get [resource]!'
               },
               i18nProblemText: {
                  'en_US': 'Halp! I could not load teh [resource] at [location]',
                  'de_DE': 'Achtung! Ressource [resource] konnte nicht geladen werden (Quelle: [location])'
               }
            }
         }
      };
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'without a localizer', () => {

      beforeEach( () => {
         publisher = errors.errorPublisherForFeature( scope, 'superFeature.superAttribute' );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'creates a function to send didEncounterError events', () => {
         publisher( 'HTTP_GET', 'failureMessage', {
            resource: 'cheese',
            moreInfo: 'You should know this.'
         } );

         expect( scope.eventBus.publish ).toHaveBeenCalledWith( 'didEncounterError.HTTP_GET', {
            code: 'HTTP_GET',
            message: 'Failed to get cheese!',
            data: {
               resource: 'cheese',
               moreInfo: 'You should know this.'
            },
            cause: {}
         }, { deliverToSender: false } );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a localizer', () => {

      function mockLocalize( i18nMessage ) {
         return i18nMessage.de_DE;
      }

      beforeEach( () => {
         publisher = errors.errorPublisherForFeature( scope, 'superFeature', {
            localizer: mockLocalize
         } );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'creates a function to send localized didEncounterError events', () => {
         publisher( 'HTTP_PUT', 'i18nProblemText', {
            resource: 'cheese',
            location: '/cheese'
         }, { status: 418, message: 'I\'m a teapot' } );

         expect( scope.eventBus.publish ).toHaveBeenCalledWith( 'didEncounterError.HTTP_PUT', {
            code: 'HTTP_PUT',
            message: 'Achtung! Ressource cheese konnte nicht geladen werden (Quelle: /cheese)',
            data: {
               resource: 'cheese',
               location: '/cheese'
            },
            cause: {
               status: 418,
               message: 'I\'m a teapot'
            }
         }, { deliverToSender: false } );
      } );

   } );

} );
