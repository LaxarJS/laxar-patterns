/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import { createAxEventBusMock } from 'laxar/laxar-widget-service-mocks';
import * as errors from '../errors';

describe( 'A standard didEncounterError-event publisher', () => {

   let publisher;
   let context;
   beforeEach( () => {
      context = {
         eventBus: createAxEventBusMock(),
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

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'without a localizer', () => {

      beforeEach( () => {
         publisher = errors.errorPublisherForFeature( context, 'superFeature.superAttribute' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'creates a function to send didEncounterError events', () => {
         publisher( 'HTTP_GET', 'failureMessage', {
            resource: 'cheese',
            moreInfo: 'You should know this.'
         } );

         expect( context.eventBus.publish ).toHaveBeenCalledWith( 'didEncounterError.HTTP_GET', {
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

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a localizer', () => {

      function mockLocalize( i18nMessage ) {
         return i18nMessage.de_DE;
      }

      beforeEach( () => {
         publisher = errors.errorPublisherForFeature( context, 'superFeature', {
            localizer: mockLocalize
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'creates a function to send localized didEncounterError events', () => {
         publisher( 'HTTP_PUT', 'i18nProblemText', {
            resource: 'cheese',
            location: '/cheese'
         }, { status: 418, message: 'I\'m a teapot' } );

         expect( context.eventBus.publish ).toHaveBeenCalledWith( 'didEncounterError.HTTP_PUT', {
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

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a custom message formatter', () => {

      function mockFormat( msg, positionArgs, kwArgs ) {
         return JSON.stringify( { msg, positionArgs, kwArgs } );
      }

      beforeEach( () => {
         publisher = errors.errorPublisherForFeature( context, 'superFeature', {
            formatter: mockFormat
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'creates a function to send didEncounterError events with custom format', () => {
         const data = {
            resource: 'cheese',
            location: '/cheese'
         };
         publisher( 'HTTP_PUT', 'i18nProblemText', data, { status: 418, message: 'I\'m a teapot' } );

         expect( context.eventBus.publish ).toHaveBeenCalledWith( 'didEncounterError.HTTP_PUT', {
            code: 'HTTP_PUT',
            message: JSON.stringify( {
               msg: context.features.superFeature.i18nProblemText,
               positionArgs: [],
               kwArgs: data
            } ),
            data,
            cause: {
               status: 418,
               message: 'I\'m a teapot'
            }
         }, { deliverToSender: false } );
      } );

   } );

} );
