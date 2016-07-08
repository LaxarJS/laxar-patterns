/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import * as validation from '../validation';
import { create as createEventBusMock } from 'laxar/lib/testing/event_bus_mock';
import { create as createConfigurationMock } from 'laxar/lib/testing/configuration_mock';
import { create as createLogMock } from 'laxar/lib/testing/log_mock';

describe( 'A validation pattern library', () => {

   let htmlMessages;
   let messagesWithLevel;
   let resource;

   beforeEach( () => {
      htmlMessages = [ {
         en: 'Something happened.'
      }, {
         en: 'Believe me!'
      } ];
      messagesWithLevel = [
         {
            htmlMessage: {
               en: 'Something happened.'
            },
            level: 'INFO'
         },
         {
            htmlMessage: {
               en: 'Believe me!'
            },
            level: 'WARNING'
         }
      ];
      resource = 'testResource';
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a method to create validation success events', () => {

      it( 'creates an outcome with SUCCESS for a resource', () => {
         expect( validation.successEvent( resource ) )
            .toEqual( {
               data: [],
               resource: resource,
               outcome: 'SUCCESS'
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'uses the level given in the messages', () => {
         expect( validation.successEvent( resource, messagesWithLevel ) )
            .toEqual( {
               data: messagesWithLevel,
               resource: resource,
               outcome: 'SUCCESS'
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'adds a default level of ERROR to the messages', () => {
         expect( validation.successEvent( resource, htmlMessages ) )
            .toEqual( {
               data: [
                  {
                     htmlMessage: htmlMessages[0],
                     level: 'ERROR'
                  },
                  {
                     htmlMessage: htmlMessages[1],
                     level: 'ERROR'
                  }
               ],
               resource: resource,
               outcome: 'SUCCESS'
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'supports messages as letargs', () => {
         expect( validation.successEvent( resource, messagesWithLevel[0], messagesWithLevel[1] ) )
            .toEqual( {
               data: messagesWithLevel,
               resource: resource,
               outcome: 'SUCCESS'
            } );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a method to create validation error events', () => {

      it( 'creates an outcome with ERROR for a resource', () => {
         expect( validation.errorEvent( resource ) )
            .toEqual( {
               data: [],
               resource: resource,
               outcome: 'ERROR'
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'uses the level given in the messages', () => {
         expect( validation.errorEvent( resource, messagesWithLevel ) )
            .toEqual( {
               data: messagesWithLevel,
               resource: resource,
               outcome: 'ERROR'
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'adds a default level of ERROR to the messages', () => {
         expect( validation.errorEvent( resource, htmlMessages ) )
            .toEqual( {
               data: [
                  {
                     htmlMessage: htmlMessages[0],
                     level: 'ERROR'
                  },
                  {
                     htmlMessage: htmlMessages[1],
                     level: 'ERROR'
                  }
               ],
               resource: resource,
               outcome: 'ERROR'
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'supports messages as letargs', () => {
         expect( validation.errorEvent( resource, messagesWithLevel[0], messagesWithLevel[1] ) )
            .toEqual( {
               data: messagesWithLevel,
               resource: resource,
               outcome: 'ERROR'
            } );
      } );

   } );


} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'A ValidationHandler', () => {

   let configurationValues;
   let configurationMock;
   let logMock;

   const anyFunc = jasmine.any( Function );
   const anyString = jasmine.any( String );
   let context;
   let validationHandler;
   let messages = null;
   let synchronousShouldThrow = false;
   let synchronousHandler;
   let resolveAsynchronousHandler;
   let rejectAsynchronousHandler;


   beforeEach( () => {
      configurationValues = {};
      configurationMock = createConfigurationMock( configurationValues );
      logMock = createLogMock();

      context = {
         eventBus: createEventBusMock(),
         features: {
            stuff: {
               resource: 'syncStuff'
            }
         }
      };

      synchronousHandler = jasmine.createSpy( 'synchronousHandler' ).and.callFake( () => {
         if( synchronousShouldThrow ) {
            throw new Error( 'Something bad happened' );
         }
         return messages;
      } );

      const promise = new Promise( ( resolve, reject ) => {
         resolveAsynchronousHandler = () => {
            resolve( messages );
            return Promise.resolve();
         };
         rejectAsynchronousHandler = () => {
            reject( new Error( 'Something bad happened' ) );
            return Promise.resolve();
         };
      } );

      const asynchronousHandler = jasmine.createSpy( 'asynchronousHandler' ).and.returnValue( promise );

      validationHandler = validation.handlerFor( context, configurationMock, logMock )
         .registerResourceFromFeature( 'stuff', synchronousHandler )
         .registerResource( 'asyncStuff', asynchronousHandler );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to validateRequest events for the given resources', () => {
      expect( context.eventBus.subscribe ).toHaveBeenCalledWith( 'validateRequest.syncStuff', anyFunc );
      expect( context.eventBus.subscribe ).toHaveBeenCalledWith( 'validateRequest.asyncStuff', anyFunc );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'throws when feature not configured', () => {
      context.eventBus.subscribe.calls.reset();
      expect( () => {
         validationHandler.registerResourceFromFeature( 'idontexist', () =>{} );
      } ).toThrow( new Error( 'Assertion error: Expected value to be defined and not null. Details: Could not find resource configuration in features for "idontexist"' ) );

      expect( context.eventBus.subscribe ).not.toHaveBeenCalled();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'does nothing when called with isOptional and feature not configured', () => {
      context.eventBus.subscribe.calls.reset();
      validationHandler.registerResourceFromFeature( 'idontexist', () =>{}, { isOptional :true } );

      expect( context.eventBus.subscribe ).not.toHaveBeenCalled();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'on validateRequest for a resource with synchronous handler', () => {

      beforeEach( done => {
         context.eventBus
            .publish( 'validateRequest.syncStuff', {
               resource: 'syncStuff'
            } )
            .then( done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'publishes a willValidate event', () => {
         expect( context.eventBus.publish ).toHaveBeenCalledWith( 'willValidate.syncStuff', {
            resource: 'syncStuff'
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'calls the according handler function', () => {
         expect( synchronousHandler ).toHaveBeenCalled();
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   [
      [ 'null', null, 'SUCCESS', [] ],
      [ 'an empty array', [], 'SUCCESS', [] ],
      [ 'a message', 'This is wrong', 'ERROR', [ { htmlMessage : 'This is wrong', level : 'ERROR' } ] ],
      [ 'an array of messages', [ 'This is wrong' ], 'ERROR', [ { htmlMessage : 'This is wrong', level : 'ERROR' } ] ]
   ]
      .forEach( function( entry ) {

         const expectedData = entry.pop();
         const expectedOutcome = entry.pop();
         const resultFixture = entry.pop();
         const what = entry.pop();

         describe( 'when a synchronous handler returns ' + what, () => {

            beforeEach( done => {
               messages = resultFixture;
               context.eventBus
                  .publish( 'validateRequest.syncStuff', {
                     resource: 'syncStuff'
                  } )
                  .then( done );
               context.eventBus.publish.calls.reset();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'sends a didValidate event with outcome ' + expectedOutcome, () => {
               expect( context.eventBus.publish )
                  .toHaveBeenCalledWith( 'didValidate.syncStuff.' + expectedOutcome, {
                     resource: 'syncStuff',
                     data: expectedData,
                     outcome: expectedOutcome
                  } );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when an asynchronous handler resolves a promise with ' + what, () => {

            beforeEach( done => {
               messages = resultFixture;
               context.eventBus
                  .publish( 'validateRequest.asyncStuff', {
                     resource: 'asyncStuff'
                  } )
                  .then( resolveAsynchronousHandler )
                  .then( done );
               context.eventBus.publish.calls.reset();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'sends a didValidate event with outcome ' + expectedOutcome, () => {
               expect( context.eventBus.publish )
                  .toHaveBeenCalledWith( 'didValidate.asyncStuff.' + expectedOutcome, {
                     resource: 'asyncStuff',
                     data: expectedData,
                     outcome: expectedOutcome
                  } );
            } );

         } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when a synchronous handler throws an exception', () => {

      beforeEach( done => {
         synchronousShouldThrow = true;
         context.eventBus
            .publish( 'validateRequest.syncStuff', {
               resource: 'syncStuff'
            } )
            .then( done );
         context.eventBus.publish.calls.reset();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'an error is logged', () => {
         expect( logMock.error ).toHaveBeenCalledWith(
            'Error handling validateRequest for resource "[0]": [1]',
            'syncStuff',
            'Something bad happened'
         );
         expect( logMock.error ).toHaveBeenCalledWith( 'Stacktrace for previous error: [0]', anyString );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'a didValidate event with outcome error and empty message is emitted', () => {
         expect( context.eventBus.publish )
            .toHaveBeenCalledWith( 'didValidate.syncStuff.ERROR', {
               resource: 'syncStuff',
               data: [ { htmlMessage: '', level : 'ERROR' } ],
               outcome: 'ERROR'
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when a specific message was configured', () => {

         beforeEach( done => {
            configurationValues[ 'lib.laxar-patterns.validation.i18nHtmlExceptionMessage' ] = {
               de: 'Technischer Fehler',
               en: 'Technical Error'
            };
            context.eventBus
               .publish( 'validateRequest.syncStuff', {
                  resource: 'syncStuff'
               } )
               .then( done );
            context.eventBus.publish.calls.reset();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'a didValidate event with outcome error and the configured message is emitted', () => {
            expect( context.eventBus.publish )
               .toHaveBeenCalledWith( 'didValidate.syncStuff.ERROR', {
                  resource: 'syncStuff',
                  data: [ { htmlMessage: {
                     de: 'Technischer Fehler',
                     en: 'Technical Error'
                  }, level: 'ERROR' } ],
                  outcome: 'ERROR'
               } );
         } );


      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when an asynchronous handler rejects the returned promise', () => {

      beforeEach( done => {
         context.eventBus
            .publish( 'validateRequest.asyncStuff', {
               resource: 'asyncStuff'
            } )
            .then( rejectAsynchronousHandler )
            .then( () => {
               // this hack is needed for PhantomJS to resolve the validation handler promise
               setTimeout( done, 0 );
            } );
         context.eventBus.publish.calls.reset();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'an error is logged', () => {
         expect( logMock.error ).toHaveBeenCalledWith(
            'Error handling validateRequest for resource "[0]": [1]',
            'asyncStuff',
            'Something bad happened'
         );
         expect( logMock.error ).toHaveBeenCalledWith( 'Stacktrace for previous error: [0]', anyString );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'a didValidate event with outcome error and empty message is emitted', () => {
         expect( context.eventBus.publish )
            .toHaveBeenCalledWith( 'didValidate.asyncStuff.ERROR', {
               resource: 'asyncStuff',
               data: [ { htmlMessage: '', level : 'ERROR' } ],
               outcome: 'ERROR'
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when a specific message was configured', () => {

         beforeEach( done => {
            configurationValues[ 'lib.laxar-patterns.validation.i18nHtmlExceptionMessage' ] = {
               de: 'Technischer Fehler',
               en: 'Technical Error'
            };
            context.eventBus
               .publish( 'validateRequest.asyncStuff', {
                  resource: 'asyncStuff'
               } )
               .then( rejectAsynchronousHandler )
               .then( done );
            context.eventBus.publish.calls.reset();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'a didValidate event with outcome error and the configured message is emitted', () => {
            expect( context.eventBus.publish )
               .toHaveBeenCalledWith( 'didValidate.asyncStuff.ERROR', {
                  resource: 'asyncStuff',
                  data: [ { htmlMessage: {
                     de: 'Technischer Fehler',
                     en: 'Technical Error'
                  }, level: 'ERROR' } ],
                  outcome: 'ERROR'
               } );
         } );


      } );

   } );

} );
