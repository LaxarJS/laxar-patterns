/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../actions',
   'laxar'
], function( actions, ax ) {
   'use strict';

   var portalMocks = ax.testing.portalMocks;
   var anyObject = jasmine.any( Object );
   var anyFunction = jasmine.any( Function );

   beforeEach( function() {
      jasmine.Clock.useMock();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An action request publisher', function() {

      var scope;
      var publisher;
      var eventPayload;

      beforeEach( function() {
         scope = {
            eventBus: portalMocks.mockEventBus(),
            features: {
               close: {
                  action: 'closeAction'
               }
            }
         };
         eventPayload = {
            action: 'closeAction'
         };
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'can be created for an action string', function() {
         publisher = actions.publisher( scope, 'closeAction' );
         publisher();

         expect( scope.eventBus.publishAndGatherReplies )
            .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, {
               deliverToSender: false
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'can be created for a feature', function() {
         publisher = actions.publisherForFeature( scope, 'close' );
         publisher();

         expect( scope.eventBus.publishAndGatherReplies )
            .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, {
               deliverToSender: false
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'passes the deliverToSender option on to the eventBus', function() {
         publisher = actions.publisher( scope, 'closeAction', {
            deliverToSender: true
         } );
         publisher();

         expect( scope.eventBus.publishAndGatherReplies )
            .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, {
               deliverToSender: true
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'passes the timeout option on to the eventBus as pendingDidTimeout', function() {
         publisher = actions.publisher( scope, 'closeAction', {
            timeout: 2000
         } );
         publisher();

         expect( scope.eventBus.publishAndGatherReplies )
            .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, {
               deliverToSender: false,
               pendingDidTimeout: 2000
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'adds additional payload passed to the publisher to the created event object', function() {
         publisher = actions.publisher( scope, 'closeAction' );
         publisher( {
            anchorDomElement: 'openPopupButton'
         } );

         eventPayload.anchorDomElement = 'openPopupButton';

         expect( scope.eventBus.publishAndGatherReplies )
            .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, anyObject );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with handlers for different outcomes of actions', function() {

         var successSpy;
         var errorSpy;
         var completeSpy;
         var resolvedSpy;
         var rejectedSpy;

         beforeEach( function() {
            successSpy = jasmine.createSpy( 'publisher.onSuccess' );
            errorSpy = jasmine.createSpy( 'publisher.onError' );
            completeSpy = jasmine.createSpy( 'publisher.onComplete' );
            resolvedSpy = jasmine.createSpy( 'resolvedSpy' );
            rejectedSpy = jasmine.createSpy( 'rejectedSpy' );

            publisher = actions.publisher( scope, 'closeAction', {
               onSuccess: successSpy,
               onError: errorSpy,
               onComplete: completeSpy
            } );
            publisher().then( resolvedSpy, rejectedSpy );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'for successful outcomes', function() {

            beforeEach( function() {
               scope.eventBus.publish( 'didTakeAction.closeAction.SUCCESS', {
                  action: 'closeAction',
                  outcome: 'SUCCESS'
               }, { sender: 'one' } );
               scope.eventBus.publish( 'didTakeAction.closeAction', {
                  action: 'closeAction'
               }, { sender: 'two' } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'calls onSuccess and onComplete', function() {
               expect( successSpy ).toHaveBeenCalled();
               expect( errorSpy ).not.toHaveBeenCalled();
               expect( completeSpy ).toHaveBeenCalled();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'passes the did responses as arguments', function() {
               var successArgs = successSpy.calls[0].args[0];
               var completeArgs = completeSpy.calls[0].args[0];

               expect( successArgs[0].event.action ).toEqual( 'closeAction' );
               expect( successArgs[0].meta.sender ).toEqual( 'one' );
               expect( successArgs[1].event.action ).toEqual( 'closeAction' );
               expect( successArgs[1].meta.sender ).toEqual( 'two' );

               expect( successArgs ).toEqual( completeArgs );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'returns a resolved promise with the did responses passed to the handler', function() {
               expect( resolvedSpy ).toHaveBeenCalled();

               var resolvedSpyArgs = resolvedSpy.calls[0].args[0];
               expect( resolvedSpyArgs[0].event.action ).toEqual( 'closeAction' );
               expect( resolvedSpyArgs[0].meta.sender ).toEqual( 'one' );
               expect( resolvedSpyArgs[1].event.action ).toEqual( 'closeAction' );
               expect( resolvedSpyArgs[1].meta.sender ).toEqual( 'two' );
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'for erroneous outcomes', function() {

            beforeEach( function() {
               scope.eventBus.publish( 'didTakeAction.closeAction.ERROR', {
                  action: 'closeAction',
                  outcome: 'ERROR'
               }, { sender: 'one' } );
               scope.eventBus.publish( 'didTakeAction.closeAction.ERROR', {
                  action: 'closeAction',
                  outcome: 'ERROR'
               }, { sender: 'two' } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'calls onSuccess and onComplete for erroneous outcomes ', function() {
               expect( successSpy ).not.toHaveBeenCalled();
               expect( errorSpy ).toHaveBeenCalled();
               expect( completeSpy ).toHaveBeenCalled();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'passes the did responses as arguments', function() {
               var errorArgs = errorSpy.calls[0].args[0];
               var completeArgs = completeSpy.calls[0].args[0];

               expect( errorArgs[0].event.action ).toEqual( 'closeAction' );
               expect( errorArgs[0].meta.sender ).toEqual( 'one' );
               expect( errorArgs[1].event.action ).toEqual( 'closeAction' );
               expect( errorArgs[1].meta.sender ).toEqual( 'two' );

               expect( errorArgs ).toEqual( completeArgs );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'returns a rejected promise with the did responses passed to the handler', function() {
               expect( rejectedSpy ).toHaveBeenCalled();

               var rejectedSpyArgs = rejectedSpy.calls[0].args[0];
               expect( rejectedSpyArgs[0].event.action ).toEqual( 'closeAction' );
               expect( rejectedSpyArgs[0].meta.sender ).toEqual( 'one' );
               expect( rejectedSpyArgs[1].event.action ).toEqual( 'closeAction' );
               expect( rejectedSpyArgs[1].meta.sender ).toEqual( 'two' );
            } );

         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An ActionHandler', function() {

      var eventBus;
      var widgetEventBus;
      var scope;
      var handler;

      beforeEach( function() {
         eventBus = portalMocks.mockEventBus();
         widgetEventBus = createEventBusWithDummySender( eventBus );

         scope = {
            eventBus: widgetEventBus,
            features: {
               close: {
                  onActions: [ 'closeAction', 'discardAction' ]
               },
               open: {
                  onActions: null
               }
            }
         };
         handler = actions.handlerFor( scope );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to the actions configured for a feature', function() {
         handler.registerActionsFromFeature( 'close', function() {} );

         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( 'takeActionRequest.closeAction', anyFunction );
         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( 'takeActionRequest.discardAction', anyFunction );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'ignores if a feature is null (or undefined)', function() {
         expect( function() { handler.registerActionsFromFeature( 'open', function() {} ); } ).not.toThrow();
         expect( widgetEventBus.subscribe ).not.toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to actions from an array', function() {
         handler.registerActions( [ 'closeAction', 'shutdownAction' ], function() {} );

         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( 'takeActionRequest.closeAction', anyFunction );
         expect( widgetEventBus.subscribe )
            .toHaveBeenCalledWith( 'takeActionRequest.shutdownAction', anyFunction );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'registerActions returns the handler for chaining', function() {
         expect( handler.registerActions( [], function() {} ) ).toBe( handler );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'registerActionsFromFeature returns the handler for chaining', function() {
         expect( handler.registerActionsFromFeature( 'open', function() {} ) ).toBe( handler );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'for a synchronous handler when one of the registered actions is published', function() {

         var handlerFunction;
         var replySpy;

         beforeEach( function() {
            handlerFunction = jasmine.createSpy( 'handlerFunction' );
            replySpy = jasmine.createSpy( 'replySpy' );

            handler.registerActions( [ 'closeAction', 'shutdownAction' ], handlerFunction );

            eventBus.publishAndGatherReplies( 'takeActionRequest.closeAction', {
               action: 'closeAction',
               anchorDomElement: 'openPopupButton'
            } ).then( replySpy );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the according handler function is called with event and meta data', function() {
            jasmine.Clock.tick( 0 );
            expect( handlerFunction ).toHaveBeenCalledWith( {
               action: 'closeAction',
               anchorDomElement: 'openPopupButton'
            }, anyObject );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'when the handler returns ERROR sends a didTakeAction with outcome ERROR', function() {
            handlerFunction.andReturn( 'ERROR' );

            jasmine.Clock.tick( 0 );
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', anyObject, {
                  deliverToSender: false
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when the handler throws an exception', function() {

            var errorHandlerSpy;

            beforeEach( function() {
               errorHandlerSpy = jasmine.createSpy( 'errorHandlerSpy' );
               eventBus.setErrorHandler( errorHandlerSpy );
               handlerFunction.andCallFake( function() {
                  throw new Error( 'failed!' );
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'when the handler throws an exception sends a didTakeAction with outcome ERROR', function() {
               expect( widgetEventBus.publish )
                  .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', anyObject, {
                     deliverToSender: false
                  } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'the exception is rethrown to be handled by default event bus error handling', function() {
               expect( errorHandlerSpy ).toHaveBeenCalled();
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'when the handler returns anything apart from ERROR sends a didTakeAction with outcome SUCCESS', function() {
            handlerFunction.andReturn( '' );

            jasmine.Clock.tick( 0 );
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', anyObject, {
                  deliverToSender: false
               } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'for an asynchronous handler when one of the registered actions is published', function() {

         var handlerFunction;
         var replySpy;

         beforeEach( function() {
            handlerFunction = jasmine.createSpy( 'handlerFunction' );
            replySpy = jasmine.createSpy( 'replySpy' );

            handler.registerActions( [ 'closeAction', 'shutdownAction' ], handlerFunction, {
               async: true
            } );

            eventBus.publishAndGatherReplies( 'takeActionRequest.closeAction', {
               action: 'closeAction',
               anchorDomElement: 'openPopupButton'
            } ).then( replySpy );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'a willTakeAction event is published for the action', function() {
            jasmine.Clock.tick( 0 );
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'willTakeAction.closeAction', anyObject, { deliverToSender: false } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the according handler function is called with event, meta and done callback', function() {
            jasmine.Clock.tick( 0 );
            expect( handlerFunction ).toHaveBeenCalledWith( {
               action: 'closeAction',
               anchorDomElement: 'openPopupButton'
            }, anyObject, anyFunction );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'when the done callback is called with ERROR, sends a didTakeAction with outcome ERROR', function() {
            handlerFunction.andCallFake( function( event, meta, done ) { done( 'ERROR' ); } );

            jasmine.Clock.tick( 0 );
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', anyObject, {
                  deliverToSender: false
               } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'when the handler throws an exception', function() {

            var errorHandlerSpy;

            beforeEach( function() {
               errorHandlerSpy = jasmine.createSpy( 'errorHandlerSpy' );
               eventBus.setErrorHandler( errorHandlerSpy );
               handlerFunction.andCallFake( function() {
                  throw new Error( 'failed!' );
               } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'when the handler throws an exception sends a didTakeAction with outcome ERROR', function() {
               expect( widgetEventBus.publish )
                  .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', anyObject, {
                     deliverToSender: false
                  } );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'the exception is rethrown to be handled by default event bus error handling', function() {
               expect( errorHandlerSpy ).toHaveBeenCalled();
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'when the done callback is called with anything apart from ERROR sends a didTakeAction with outcome SUCCESS', function() {
            handlerFunction.andCallFake( function( event, meta, done ) { done(); } );

            jasmine.Clock.tick( 0 );
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', anyObject, {
                  deliverToSender: false
               } );
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createEventBusWithDummySender( eventBus ) {
      return {
         subscribe: jasmine.createSpy().andCallFake( function( eventName, subscriber, optionalOptions ) {
            var options = ax.object.options( optionalOptions, { subscriber: 'dummy' } );
            return eventBus.subscribe( eventName, subscriber, options );
         } ),
         publish: jasmine.createSpy().andCallFake( function( eventName, optionalEvent, optionalOptions ) {
            var options = ax.object.options( optionalOptions, { sender: 'dummy' } );
            return eventBus.publish( eventName, optionalEvent, options );
         } )
      };
   }

} );
