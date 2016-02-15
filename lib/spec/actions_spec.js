/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import * as actions from '../actions';
import * as q from 'q';
import { object, _tooling } from 'laxar';
import { create as createEventBusMock } from 'laxar/lib/testing/event_bus_mock';

var anyObject = jasmine.any( Object );
var anyFunction = jasmine.any( Function );

describe( 'An action request publisher', () => {

   var scope;
   var publisher;
   var eventPayload;

   beforeEach( () => {
      _tooling.provideQ = () => q;

      scope = {
         eventBus: createEventBusMock(),
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

   it( 'can be created for an action string', () => {
      publisher = actions.publisher( scope, 'closeAction' );
      publisher();

      expect( scope.eventBus.publishAndGatherReplies )
         .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, {
            deliverToSender: false
         } );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'can be created for a feature', () => {
      publisher = actions.publisherForFeature( scope, 'close' );
      publisher();

      expect( scope.eventBus.publishAndGatherReplies )
         .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, {
            deliverToSender: false
         } );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'passes the deliverToSender option on to the eventBus', () => {
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

   it( 'passes the timeout option on to the eventBus as pendingDidTimeout', () => {
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

   it( 'adds additional payload passed to the publisher to the created event object', () => {
      publisher = actions.publisher( scope, 'closeAction' );
      publisher( {
         anchorDomElement: 'openPopupButton'
      } );

      eventPayload.anchorDomElement = 'openPopupButton';

      expect( scope.eventBus.publishAndGatherReplies )
         .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, anyObject );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with handlers for different outcomes of actions', () => {

      var successSpy;
      var errorSpy;
      var completeSpy;
      var resolvedSpy;
      var rejectedSpy;

      beforeEach( () => {
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
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'for successful outcomes', () => {

         beforeEach( done => {
            scope.eventBus.subscribe( 'takeActionRequest.closeAction', () => {
               scope.eventBus.publish( 'didTakeAction.closeAction.SUCCESS', {
                  action: 'closeAction',
                  outcome: 'SUCCESS'
               }, { sender: 'one' } );
               scope.eventBus.publish( 'didTakeAction.closeAction', {
                  action: 'closeAction'
               }, { sender: 'two' } );
            } );

            publisher()
               .then( resolvedSpy, rejectedSpy )
               .then( done );
         } );

         //////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls onSuccess and onComplete', () => {
            expect( successSpy ).toHaveBeenCalled();
            expect( errorSpy ).not.toHaveBeenCalled();
            expect( completeSpy ).toHaveBeenCalled();
         } );

         //////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'passes the did responses as arguments', () => {
            var successArgs = successSpy.calls.argsFor( 0 )[0];
            var completeArgs = completeSpy.calls.argsFor( 0 )[0];

            expect( successArgs[0].event.action ).toEqual( 'closeAction' );
            expect( successArgs[0].meta.sender ).toEqual( 'one' );
            expect( successArgs[1].event.action ).toEqual( 'closeAction' );
            expect( successArgs[1].meta.sender ).toEqual( 'two' );

            expect( successArgs ).toEqual( completeArgs );
         } );

         //////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'returns a resolved promise with the did responses passed to the handler', () => {
            expect( resolvedSpy ).toHaveBeenCalled();

            var resolvedSpyArgs = resolvedSpy.calls.argsFor( 0 )[0];
            expect( resolvedSpyArgs[0].event.action ).toEqual( 'closeAction' );
            expect( resolvedSpyArgs[0].meta.sender ).toEqual( 'one' );
            expect( resolvedSpyArgs[1].event.action ).toEqual( 'closeAction' );
            expect( resolvedSpyArgs[1].meta.sender ).toEqual( 'two' );
         } );

      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'for erroneous outcomes', () => {

         beforeEach( done => {
            scope.eventBus.subscribe( 'takeActionRequest.closeAction', () => {
               scope.eventBus.publish( 'didTakeAction.closeAction.ERROR', {
                  action: 'closeAction',
                  outcome: 'ERROR'
               }, { sender: 'one' } );
               scope.eventBus.publish( 'didTakeAction.closeAction.ERROR', {
                  action: 'closeAction',
                  outcome: 'ERROR'
               }, { sender: 'two' } );
            } );

            publisher()
               .then( resolvedSpy, rejectedSpy )
               .then( done );
         } );

         //////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls onSuccess and onComplete for erroneous outcomes ', () => {
            expect( successSpy ).not.toHaveBeenCalled();
            expect( errorSpy ).toHaveBeenCalled();
            expect( completeSpy ).toHaveBeenCalled();
         } );

         //////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'passes the did responses as arguments', () => {
            var errorArgs = errorSpy.calls.argsFor( 0 )[0];
            var completeArgs = completeSpy.calls.argsFor( 0 )[0];

            expect( errorArgs[0].event.action ).toEqual( 'closeAction' );
            expect( errorArgs[0].meta.sender ).toEqual( 'one' );
            expect( errorArgs[1].event.action ).toEqual( 'closeAction' );
            expect( errorArgs[1].meta.sender ).toEqual( 'two' );

            expect( errorArgs ).toEqual( completeArgs );
         } );

         //////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'returns a rejected promise with the did responses passed to the handler', () => {
            expect( rejectedSpy ).toHaveBeenCalled();

            var rejectedSpyArgs = rejectedSpy.calls.argsFor( 0 )[0];
            expect( rejectedSpyArgs[0].event.action ).toEqual( 'closeAction' );
            expect( rejectedSpyArgs[0].meta.sender ).toEqual( 'one' );
            expect( rejectedSpyArgs[1].event.action ).toEqual( 'closeAction' );
            expect( rejectedSpyArgs[1].meta.sender ).toEqual( 'two' );
         } );

      } );

   } );

} );

///////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'An ActionHandler', () => {

   function registerActionsAndPublish() {
      handler.registerActions( [ 'closeAction', 'shutdownAction' ], handlerFunction );

      return eventBus.publishAndGatherReplies( 'takeActionRequest.closeAction', {
         action: 'closeAction',
         anchorDomElement: 'openPopupButton'
      } ).then( replySpy );
   }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   var eventOptions;
   var eventBus;
   var widgetEventBus;
   var scope;
   var handler;
   var handlerFunction;
   var replySpy;

   function createEventBusWithDummySender( eventBus ) {
      return {
         subscribe: jasmine.createSpy().and.callFake( ( eventName, subscriber, optionalOptions ) => {
            var options = object.options( optionalOptions, { subscriber: 'dummy' } );
            return eventBus.subscribe( eventName, subscriber, options );
         } ),
         publish: jasmine.createSpy().and.callFake( ( eventName, optionalEvent, optionalOptions ) => {
            var options = object.options( optionalOptions, { sender: 'dummy' } );
            return eventBus.publish( eventName, optionalEvent, options );
         } )
      };
   }

   beforeEach( () => {
      eventOptions = { deliverToSender: false };
      eventBus = createEventBusMock();
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

   it( 'subscribes to the actions configured for a feature', () => {
      handler.registerActionsFromFeature( 'close', () => {} );

      expect( widgetEventBus.subscribe )
         .toHaveBeenCalledWith( 'takeActionRequest.closeAction', anyFunction );
      expect( widgetEventBus.subscribe )
         .toHaveBeenCalledWith( 'takeActionRequest.discardAction', anyFunction );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'ignores if a feature is null (or undefined)', () => {
      expect( () => { handler.registerActionsFromFeature( 'open', () => {} ); } ).not.toThrow();
      expect( widgetEventBus.subscribe ).not.toHaveBeenCalled();
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to actions from an array', () => {
      handler.registerActions( [ 'closeAction', 'shutdownAction' ], () => {} );

      expect( widgetEventBus.subscribe )
         .toHaveBeenCalledWith( 'takeActionRequest.closeAction', anyFunction );
      expect( widgetEventBus.subscribe )
         .toHaveBeenCalledWith( 'takeActionRequest.shutdownAction', anyFunction );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'registerActions returns the handler for chaining', () => {
      expect( handler.registerActions( [], () => {} ) ).toBe( handler );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'registerActionsFromFeature returns the handler for chaining', () => {
      expect( handler.registerActionsFromFeature( 'open', () => {} ) ).toBe( handler );
   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler throws an error', () => {

      var errorHandlerSpy;

      beforeEach( done => {
         errorHandlerSpy = jasmine.createSpy( 'errorHandlerSpy' );
         eventBus.setErrorHandler( errorHandlerSpy );
         handlerFunction.and.callFake( () => {
            throw new Error( 'failed!' );
         } );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome ERROR', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', anyObject, eventOptions );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'the error is rethrown to be handled by default event bus error handling', () => {
         expect( errorHandlerSpy ).toHaveBeenCalled();
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a simple value', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => 42 );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS'
            }, eventOptions );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns an object with outcome ERROR', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => ({ outcome: 'ERROR', value: 42 }) );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome ERROR and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
               action: 'closeAction',
               outcome: 'ERROR',
               value: 42
            }, eventOptions );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns an object with outcome != ERROR', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => ({ outcome: 'BLARGH', value: 42 }) );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS',
               value: 42
            }, eventOptions );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns an object', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => ({ value: 42 }) );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS',
               value: 42
            }, eventOptions );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a resolved promise with simple value', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => q.when( 42 ) );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS'
            }, eventOptions );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a resolved promise with object', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => q.when( { value: 42 } ) );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS',
               value: 42
            }, eventOptions );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a resolved promise with object with outcome ERROR', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => q.when( { outcome: 'ERROR', value: 42 } ) );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome ERROR and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
               action: 'closeAction',
               outcome: 'ERROR',
               value: 42
            }, eventOptions );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a resolved promise with object with outcome != ERROR', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => q.when( { outcome: 'BLARGH', value: 42 } ) );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS',
               value: 42
            }, eventOptions );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a rejected promise with simple value', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => q.reject( 42 ) );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome ERROR', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
               action: 'closeAction',
               outcome: 'ERROR'
            }, eventOptions );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a rejected promise with object', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => q.reject( { value: 42 } ) );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome ERROR and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
               action: 'closeAction',
               outcome: 'ERROR',
               value: 42
            }, eventOptions );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a rejected promise with object with outcome SUCCESS', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => q.reject( { outcome: 'SUCCESS', value: 42 } ) );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS',
               value: 42
            }, eventOptions );
      } );

   } );

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a resolved promise with object with outcome != SUCCESS', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => q.reject( { outcome: 'BLARGH', value: 42 } ) );

         registerActionsAndPublish()
            .then( done );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome ERROR and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
               action: 'closeAction',
               outcome: 'ERROR',
               value: 42
            }, eventOptions );
      } );

   } );

} );
