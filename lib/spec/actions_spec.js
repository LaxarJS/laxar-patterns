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

      function registerActionsAndPublish() {
         handler.registerActions( [ 'closeAction', 'shutdownAction' ], handlerFunction );

         eventBus.publishAndGatherReplies( 'takeActionRequest.closeAction', {
            action: 'closeAction',
            anchorDomElement: 'openPopupButton'
         } ).then( replySpy );

         jasmine.Clock.tick( 0 );
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      var eventOptions;
      var eventBus;
      var widgetEventBus;
      var scope;
      var handler;
      var handlerFunction;
      var replySpy;

      beforeEach( function() {
         eventOptions = { deliverToSender: false };
         eventBus = portalMocks.mockEventBus();
         widgetEventBus = createEventBusWithDummySender( eventBus );
         handlerFunction = jasmine.createSpy( 'handlerFunction' );
         replySpy = jasmine.createSpy( 'replySpy' );

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

      describe( 'when the handler throws an error', function() {

         var errorHandlerSpy;

         beforeEach( function() {
            errorHandlerSpy = jasmine.createSpy( 'errorHandlerSpy' );
            eventBus.setErrorHandler( errorHandlerSpy );
            handlerFunction.andCallFake( function() {
               throw new Error( 'failed!' );
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome ERROR', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', anyObject, eventOptions );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the error is rethrown to be handled by default event bus error handling', function() {
            expect( errorHandlerSpy ).toHaveBeenCalled();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the handler returns a simple value', function() {

         beforeEach( function() {
            handlerFunction.andCallFake( function() {
               return 42;
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome SUCCESS', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
                  action: 'closeAction',
                  outcome: 'SUCCESS'
               }, eventOptions );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the handler returns an object with outcome ERROR', function() {

         beforeEach( function() {
            handlerFunction.andCallFake( function() {
               return { outcome: 'ERROR', value: 42 };
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome ERROR and uses the object as event object basis', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
                  action: 'closeAction',
                  outcome: 'ERROR',
                  value: 42
               }, eventOptions );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the handler returns an object with outcome != ERROR', function() {

         beforeEach( function() {
            handlerFunction.andCallFake( function() {
               return { outcome: 'BLARGH', value: 42 };
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
                  action: 'closeAction',
                  outcome: 'SUCCESS',
                  value: 42
               }, eventOptions );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the handler returns an object', function() {

         beforeEach( function() {
            handlerFunction.andCallFake( function() {
               return { value: 42 };
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
                  action: 'closeAction',
                  outcome: 'SUCCESS',
                  value: 42
               }, eventOptions );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the handler returns a resolved promise with simple value', function() {

         beforeEach( function() {
            handlerFunction.andCallFake( function() {
               return portalMocks.mockQ().when( 42 )
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome SUCCESS', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
                  action: 'closeAction',
                  outcome: 'SUCCESS'
               }, eventOptions );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the handler returns a resolved promise with object', function() {

         beforeEach( function() {
            handlerFunction.andCallFake( function() {
               return portalMocks.mockQ().when( { value: 42 } )
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
                  action: 'closeAction',
                  outcome: 'SUCCESS',
                  value: 42
               }, eventOptions );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the handler returns a resolved promise with object with outcome ERROR', function() {

         beforeEach( function() {
            handlerFunction.andCallFake( function() {
               return portalMocks.mockQ().when( { outcome: 'ERROR', value: 42 } )
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome ERROR and uses the object as event object basis', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
                  action: 'closeAction',
                  outcome: 'ERROR',
                  value: 42
               }, eventOptions );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the handler returns a resolved promise with object with outcome != ERROR', function() {

         beforeEach( function() {
            handlerFunction.andCallFake( function() {
               return portalMocks.mockQ().when( { outcome: 'BLARGH', value: 42 } )
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
                  action: 'closeAction',
                  outcome: 'SUCCESS',
                  value: 42
               }, eventOptions );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the handler returns a rejected promise with simple value', function() {

         beforeEach( function() {
            handlerFunction.andCallFake( function() {
               return portalMocks.mockQ().reject( 42 )
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome ERROR', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
                  action: 'closeAction',
                  outcome: 'ERROR'
               }, eventOptions );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the handler returns a rejected promise with object', function() {

         beforeEach( function() {
            handlerFunction.andCallFake( function() {
               return portalMocks.mockQ().reject( { value: 42 } )
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome ERROR and uses the object as event object basis', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
                  action: 'closeAction',
                  outcome: 'ERROR',
                  value: 42
               }, eventOptions );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the handler returns a rejected promise with object with outcome SUCCESS', function() {

         beforeEach( function() {
            handlerFunction.andCallFake( function() {
               return portalMocks.mockQ().reject( { outcome: 'SUCCESS', value: 42 } )
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
                  action: 'closeAction',
                  outcome: 'SUCCESS',
                  value: 42
               }, eventOptions );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the handler returns a resolved promise with object with outcome != SUCCESS', function() {

         beforeEach( function() {
            handlerFunction.andCallFake( function() {
               return portalMocks.mockQ().reject( { outcome: 'BLARGH', value: 42 } )
            } );

            registerActionsAndPublish();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sends a didTakeAction with outcome ERROR and uses the object as event object basis', function() {
            expect( widgetEventBus.publish )
               .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
                  action: 'closeAction',
                  outcome: 'ERROR',
                  value: 42
               }, eventOptions );
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
