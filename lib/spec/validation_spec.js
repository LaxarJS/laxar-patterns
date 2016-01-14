/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../validation',
   'laxar/laxar_testing'
], function( validation, ax ) {
   'use strict';

   describe( 'A validation pattern library', function() {

      var htmlMessages;
      var messagesWithLevel;
      var resource;

      beforeEach( function() {
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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a method to create validation success events', function() {

         it( 'creates an outcome with SUCCESS for a resource', function() {
            expect( validation.successEvent( resource ) )
               .toEqual( {
                  data: [],
                  resource: resource,
                  outcome: 'SUCCESS'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses the level given in the messages', function() {
            expect( validation.successEvent( resource, messagesWithLevel ) )
               .toEqual( {
                  data: messagesWithLevel,
                  resource: resource,
                  outcome: 'SUCCESS'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'adds a default level of ERROR to the messages', function() {
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

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'supports messages as varargs (jira ATP-7234)', function() {
            expect( validation.successEvent( resource, messagesWithLevel[0], messagesWithLevel[1] ) )
               .toEqual( {
                  data: messagesWithLevel,
                  resource: resource,
                  outcome: 'SUCCESS'
               } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a method to create validation error events', function() {

         it( 'creates an outcome with ERROR for a resource', function() {
            expect( validation.errorEvent( resource ) )
               .toEqual( {
                  data: [],
                  resource: resource,
                  outcome: 'ERROR'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses the level given in the messages', function() {
            expect( validation.errorEvent( resource, messagesWithLevel ) )
               .toEqual( {
                  data: messagesWithLevel,
                  resource: resource,
                  outcome: 'ERROR'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'adds a default level of ERROR to the messages', function() {
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

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'supports messages as varargs (jira ATP-7234)', function() {
            expect( validation.errorEvent( resource, messagesWithLevel[0], messagesWithLevel[1] ) )
               .toEqual( {
                  data: messagesWithLevel,
                  resource: resource,
                  outcome: 'ERROR'
               } );
         } );

      } );


   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A ValidationHandler', function() {

      var anyFunc = jasmine.any( Function );
      var anyString = jasmine.any( String );
      var q;
      var context;
      var validationHandler;
      var messages = null;
      var synchronousShouldThrow = false;
      var synchronousHandler;
      var asynchronousHandler;
      var resolveAsynchronousHandler;
      var rejectAsynchronousHandler;


      beforeEach( function() {
         q = ax.testing.portalMocks.mockQ();
         context = {
            eventBus: ax.testing.portalMocks.mockEventBus(),
            features: {
               stuff: {
                  resource: 'syncStuff'
               }
            }
         };

         synchronousHandler = jasmine.createSpy( 'synchronousHandler' ).andCallFake( function() {
            if( synchronousShouldThrow ) {
               throw new Error( 'Something bad happened' );
            }
            return messages;
         } );

         var deferred = q.defer();
         resolveAsynchronousHandler = function() {
            deferred.resolve( messages );
         };
         rejectAsynchronousHandler = function() {
            deferred.reject( new Error( 'Something bad happened' ) );
         };

         asynchronousHandler = jasmine.createSpy( 'asynchronousHandler' ).andReturn( deferred.promise );

         validationHandler = validation.handlerFor( context )
            .registerResourceFromFeature( 'stuff', synchronousHandler )
            .registerResource( 'asyncStuff', asynchronousHandler );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to validateRequest events for the given resources', function() {
         expect( context.eventBus.subscribe ).toHaveBeenCalledWith( 'validateRequest.syncStuff', anyFunc );
         expect( context.eventBus.subscribe ).toHaveBeenCalledWith( 'validateRequest.asyncStuff', anyFunc );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'throws when feature not configured', function() {
         context.eventBus.subscribe.reset();
         expect( function() {
            validationHandler.registerResourceFromFeature( 'idontexist', function(){} );
         } ).toThrow( 'Assertion error: Expected value to be defined and not null. Details: Could not find resource configuration in features for "idontexist"' );

         expect( context.eventBus.subscribe ).not.toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does nothing when called with isOptional and feature not configured', function() {
         context.eventBus.subscribe.reset();
         validationHandler.registerResourceFromFeature( 'idontexist', function(){}, { isOptional :true } );

         expect( context.eventBus.subscribe ).not.toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'on validateRequest for a resource with synchronous handler', function() {

         beforeEach( function() {
            context.eventBus.publish( 'validateRequest.syncStuff', {
               resource: 'syncStuff'
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'publishes a willValidate event', function() {
            expect( context.eventBus.publish ).toHaveBeenCalledWith( 'willValidate.syncStuff', {
               resource: 'syncStuff'
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls the according handler function', function() {
            expect( synchronousHandler ).toHaveBeenCalled();
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      [
         [ 'null', null, 'SUCCESS', [] ],
         [ 'an empty array', [], 'SUCCESS', [] ],
         [ 'a message', 'This is wrong', 'ERROR', [ { htmlMessage : 'This is wrong', level : 'ERROR' } ] ],
         [ 'an array of messages', [ 'This is wrong' ], 'ERROR', [ { htmlMessage : 'This is wrong', level : 'ERROR' } ] ]
      ]
         .forEach( function( entry ) {

            var expectedData = entry.pop();
            var expectedOutcome = entry.pop();
            var resultFixture = entry.pop();
            var what = entry.pop();

            describe( 'when a synchronous handler returns ' + what, function() {

               beforeEach( function() {
                  messages = resultFixture;
                  context.eventBus.publish( 'validateRequest.syncStuff', {
                     resource: 'syncStuff'
                  } );
                  context.eventBus.publish.reset();
                  jasmine.Clock.tick( 0 );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'sends a didValidate event with outcome ' + expectedOutcome, function() {
                  expect( context.eventBus.publish )
                     .toHaveBeenCalledWith( 'didValidate.syncStuff.' + expectedOutcome, {
                        resource: 'syncStuff',
                        data: expectedData,
                        outcome: expectedOutcome
                     } );
               } );

            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            describe( 'when an asynchronous handler resolves a promise with ' + what, function() {

               beforeEach( function() {
                  messages = resultFixture;
                  context.eventBus.publish( 'validateRequest.asyncStuff', {
                     resource: 'asyncStuff'
                  } );
                  context.eventBus.publish.reset();
                  resolveAsynchronousHandler();
                  jasmine.Clock.tick( 0 );
               } );

               ///////////////////////////////////////////////////////////////////////////////////////////////

               it( 'sends a didValidate event with outcome ' + expectedOutcome, function() {
                  expect( context.eventBus.publish )
                     .toHaveBeenCalledWith( 'didValidate.asyncStuff.' + expectedOutcome, {
                        resource: 'asyncStuff',
                        data: expectedData,
                        outcome: expectedOutcome
                     } );
               } );

            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when a synchronous handler throws an exception', function() {

         beforeEach( function() {
            spyOn( ax.log, 'error' );

            synchronousShouldThrow = true;
            context.eventBus.publish( 'validateRequest.syncStuff', {
               resource: 'syncStuff'
            } );
            context.eventBus.publish.reset();
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'an error is logged', function() {
            expect( ax.log.error ).toHaveBeenCalledWith(
               'Error handling validateRequest for resource "[0]": [1]',
               'syncStuff',
               'Something bad happened'
            );
            expect( ax.log.error ).toHaveBeenCalledWith( 'Stacktrace for previous error: [0]', anyString );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'a didValidate event with outcome error and empty message is emitted', function() {
            expect( context.eventBus.publish )
               .toHaveBeenCalledWith( 'didValidate.syncStuff.ERROR', {
                  resource: 'syncStuff',
                  data: [ { htmlMessage: '', level : 'ERROR' } ],
                  outcome: 'ERROR'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when a specific message was configured', function() {

            beforeEach( function() {
               spyOn( ax.configuration, 'get' ).andCallFake( function( key ) {
                  if( key === 'lib.laxar-patterns.validation.i18nHtmlExceptionMessage' ) {
                     return {
                        de: 'Technischer Fehler',
                        en: 'Technical Error'
                     };
                  }
               } );
               context.eventBus.publish( 'validateRequest.syncStuff', {
                  resource: 'syncStuff'
               } );
               context.eventBus.publish.reset();
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'a didValidate event with outcome error and the configured message is emitted', function() {
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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when an asynchronous handler rejects the returned promise', function() {

         beforeEach( function() {
            spyOn( ax.log, 'error' );

            context.eventBus.publish( 'validateRequest.asyncStuff', {
               resource: 'asyncStuff'
            } );
            rejectAsynchronousHandler();
            context.eventBus.publish.reset();
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'an error is logged', function() {
            expect( ax.log.error ).toHaveBeenCalledWith(
               'Error handling validateRequest for resource "[0]": [1]',
               'asyncStuff',
               'Something bad happened'
            );
            expect( ax.log.error ).toHaveBeenCalledWith( 'Stacktrace for previous error: [0]', anyString );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'a didValidate event with outcome error and empty message is emitted', function() {
            expect( context.eventBus.publish )
               .toHaveBeenCalledWith( 'didValidate.asyncStuff.ERROR', {
                  resource: 'asyncStuff',
                  data: [ { htmlMessage: '', level : 'ERROR' } ],
                  outcome: 'ERROR'
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when a specific message was configured', function() {

            beforeEach( function() {
               spyOn( ax.configuration, 'get' ).andCallFake( function( key ) {
                  if( key === 'lib.laxar-patterns.validation.i18nHtmlExceptionMessage' ) {
                     return {
                        de: 'Technischer Fehler',
                        en: 'Technical Error'
                     };
                  }
               } );
               context.eventBus.publish( 'validateRequest.asyncStuff', {
                  resource: 'asyncStuff'
               } );
               rejectAsynchronousHandler();
               context.eventBus.publish.reset();
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'a didValidate event with outcome error and the configured message is emitted', function() {
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

} );
