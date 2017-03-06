/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import { object } from 'laxar';
import { create as createEventBusMock } from 'laxar/lib/testing/event_bus_mock';
import * as actions from '../actions';

const anyObject = jasmine.any( Object );
const anyFunction = jasmine.any( Function );

describe( 'An action request publisher', () => {

   let context;
   let publisher;
   let eventPayload;

   beforeEach( () => {

      context = {
         eventBus: createEventBusMock( { nextTick: _ => Promise.resolve().then( _ ) } ),
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

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'can be created for an action string', () => {
      publisher = actions.publisher( context, 'closeAction' );
      publisher();

      expect( context.eventBus.publishAndGatherReplies )
         .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, {
            deliverToSender: false
         } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'can be created for a feature', () => {
      publisher = actions.publisherForFeature( context, 'close' );
      publisher();

      expect( context.eventBus.publishAndGatherReplies )
         .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, {
            deliverToSender: false
         } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'passes the deliverToSender option on to the eventBus', () => {
      publisher = actions.publisher( context, 'closeAction', {
         deliverToSender: true
      } );
      publisher();

      expect( context.eventBus.publishAndGatherReplies )
         .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, {
            deliverToSender: true
         } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'passes the timeout option on to the eventBus as pendingDidTimeout', () => {
      publisher = actions.publisher( context, 'closeAction', {
         timeout: 2000
      } );
      publisher();

      expect( context.eventBus.publishAndGatherReplies )
         .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, {
            deliverToSender: false,
            pendingDidTimeout: 2000
         } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'adds additional payload passed to the publisher to the created event object', () => {
      publisher = actions.publisher( context, 'closeAction' );
      publisher( {
         anchorDomElement: 'openPopupButton'
      } );

      eventPayload.anchorDomElement = 'openPopupButton';

      expect( context.eventBus.publishAndGatherReplies )
         .toHaveBeenCalledWith( 'takeActionRequest.closeAction', eventPayload, anyObject );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'can be connected directly to a context property', () => {
      actions.connectPublisherToFeature( context, 'close' );
      expect( context.actions.close ).toEqual( jasmine.any( Function ) );

      context.actions.close( {} );
      expect( context.eventBus.publishAndGatherReplies )
         .toHaveBeenCalledWith(
            'takeActionRequest.closeAction',
            jasmine.any( Object ),
            jasmine.any( Object )
         );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with handlers for different outcomes of actions', () => {

      let successSpy;
      let errorSpy;
      let completeSpy;
      let resolvedSpy;
      let rejectedSpy;

      beforeEach( () => {
         successSpy = jasmine.createSpy( 'publisher.onSuccess' );
         errorSpy = jasmine.createSpy( 'publisher.onError' );
         completeSpy = jasmine.createSpy( 'publisher.onComplete' );
         resolvedSpy = jasmine.createSpy( 'resolvedSpy' );
         rejectedSpy = jasmine.createSpy( 'rejectedSpy' );

         publisher = actions.publisher( context, 'closeAction', {
            onSuccess: successSpy,
            onError: errorSpy,
            onComplete: completeSpy
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'for successful outcomes', () => {

         beforeEach( done => {
            context.eventBus.subscribe( 'takeActionRequest.closeAction', () => {
               context.eventBus.publish( 'didTakeAction.closeAction.SUCCESS', {
                  action: 'closeAction',
                  outcome: 'SUCCESS'
               }, { sender: 'one' } );
               context.eventBus.publish( 'didTakeAction.closeAction', {
                  action: 'closeAction'
               }, { sender: 'two' } );
            } );

            publisher()
               .then( resolvedSpy, rejectedSpy )
               .then( done, done.fail );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls onSuccess and onComplete', () => {
            expect( successSpy ).toHaveBeenCalled();
            expect( errorSpy ).not.toHaveBeenCalled();
            expect( completeSpy ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'passes the did responses as arguments', () => {
            const successArgs = successSpy.calls.argsFor( 0 )[ 0 ];
            const completeArgs = completeSpy.calls.argsFor( 0 )[ 0 ];

            {
               const { event, meta } = successArgs[ 0 ];
               expect( event.action ).toEqual( 'closeAction' );
               expect( meta.sender ).toEqual( 'one' );
            }

            {
               const { event, meta } = successArgs[ 1 ];
               expect( event.action ).toEqual( 'closeAction' );
               expect( meta.sender ).toEqual( 'two' );
            }

            expect( successArgs ).toEqual( completeArgs );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'returns a resolved promise with overall outcome SUCCESS and the collected responses', () => {
            expect( resolvedSpy ).toHaveBeenCalled();

            const resolvedSpyArgs = resolvedSpy.calls.argsFor( 0 )[ 0 ];
            expect( resolvedSpyArgs.outcome ).toEqual( actions.OUTCOME_SUCCESS );

            {
               const { event, meta } = resolvedSpyArgs.responses[ 0 ];
               expect( event.action ).toEqual( 'closeAction' );
               expect( meta.sender ).toEqual( 'one' );
            }

            {
               const { event, meta } = resolvedSpyArgs.responses[ 1 ];
               expect( event.action ).toEqual( 'closeAction' );
               expect( meta.sender ).toEqual( 'two' );
            }

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'for erroneous outcomes', () => {

         beforeEach( done => {
            context.eventBus.subscribe( 'takeActionRequest.closeAction', () => {
               context.eventBus.publish( 'didTakeAction.closeAction.ERROR', {
                  action: 'closeAction',
                  outcome: 'ERROR'
               }, { sender: 'one' } );
               context.eventBus.publish( 'didTakeAction.closeAction.ERROR', {
                  action: 'closeAction',
                  outcome: 'ERROR'
               }, { sender: 'two' } );
            } );

            publisher()
               .then( resolvedSpy, rejectedSpy )
               .then( done, done.fail );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls onSuccess and onComplete for erroneous outcomes ', () => {
            expect( successSpy ).not.toHaveBeenCalled();
            expect( errorSpy ).toHaveBeenCalled();
            expect( completeSpy ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'passes the did-responses as arguments', () => {
            const errorArgs = errorSpy.calls.argsFor( 0 )[ 0 ];
            const completeArgs = completeSpy.calls.argsFor( 0 )[ 0 ];

            {
               const { event, meta } = errorArgs[ 0 ];
               expect( event.action ).toEqual( 'closeAction' );
               expect( meta.sender ).toEqual( 'one' );
            }

            {
               const { event, meta } = errorArgs[ 1 ];
               expect( event.action ).toEqual( 'closeAction' );
               expect( meta.sender ).toEqual( 'two' );
            }

            expect( errorArgs ).toEqual( completeArgs );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'returns a resolved promise with overall outcome ERROR and the collected responses', () => {
            expect( resolvedSpy ).toHaveBeenCalled();

            const resolvedSpyArgs = resolvedSpy.calls.argsFor( 0 )[ 0 ];
            expect( resolvedSpyArgs.outcome ).toEqual( actions.OUTCOME_ERROR );

            {
               const { event, meta } = resolvedSpyArgs.responses[ 0 ];
               expect( event.action ).toEqual( 'closeAction' );
               expect( meta.sender ).toEqual( 'one' );
            }

            {
               const { event, meta } = resolvedSpyArgs.responses[ 1 ];
               expect( event.action ).toEqual( 'closeAction' );
               expect( meta.sender ).toEqual( 'two' );
            }
         } );

      } );

   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'An ActionHandler', () => {

   let eventOptions;
   let eventBus;
   let widgetEventBus;
   let handler;
   let handlerFunction;
   let replySpy;
   let errorHandlerSpy;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function createEventBusWithDummySender( eventBus ) {
      return {
         subscribe: jasmine.createSpy().and.callFake( ( eventName, subscriber, optionalOptions ) => {
            const options = object.options( optionalOptions, { subscriber: 'dummy' } );
            return eventBus.subscribe( eventName, subscriber, options );
         } ),
         publish: jasmine.createSpy().and.callFake( ( eventName, optionalEvent, optionalOptions ) => {
            const options = object.options( optionalOptions, { sender: 'dummy' } );
            return eventBus.publish( eventName, optionalEvent, options );
         } )
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function registerActionsAndPublish() {
      handler.registerActions( [ 'closeAction', 'shutdownAction' ], handlerFunction );

      return eventBus.publishAndGatherReplies( 'takeActionRequest.closeAction', {
         action: 'closeAction',
         anchorDomElement: 'openPopupButton'
      } ).then( replySpy );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      errorHandlerSpy = jasmine.createSpy( 'errorHandler' );
      eventOptions = { deliverToSender: false };
      eventBus = createEventBusMock( {
         nextTick: _ => Promise.resolve().then( _ ),
         errorHandler: errorHandlerSpy
      } );
      widgetEventBus = createEventBusWithDummySender( eventBus );
      handlerFunction = jasmine.createSpy( 'handlerFunction' );
      replySpy = jasmine.createSpy( 'replySpy' );

      const context = {
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
      handler = actions.handlerFor( context );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to the actions configured for a feature', () => {
      handler.registerActionsFromFeature( 'close', () => {} );

      expect( widgetEventBus.subscribe )
         .toHaveBeenCalledWith( 'takeActionRequest.closeAction', anyFunction );
      expect( widgetEventBus.subscribe )
         .toHaveBeenCalledWith( 'takeActionRequest.discardAction', anyFunction );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'ignores if a feature is null (or undefined)', () => {
      expect( () => { handler.registerActionsFromFeature( 'open', () => {} ); } ).not.toThrow();
      expect( widgetEventBus.subscribe ).not.toHaveBeenCalled();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to actions from an array', () => {
      handler.registerActions( [ 'closeAction', 'shutdownAction' ], () => {} );

      expect( widgetEventBus.subscribe )
         .toHaveBeenCalledWith( 'takeActionRequest.closeAction', anyFunction );
      expect( widgetEventBus.subscribe )
         .toHaveBeenCalledWith( 'takeActionRequest.shutdownAction', anyFunction );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'registerActions returns the handler for chaining', () => {
      expect( handler.registerActions( [], () => {} ) ).toBe( handler );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'registerActionsFromFeature returns the handler for chaining', () => {
      expect( handler.registerActionsFromFeature( 'open', () => {} ) ).toBe( handler );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler throws an error', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => {
            throw new Error( 'failed!' );
         } );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome ERROR', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', anyObject, eventOptions );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'the error is rethrown to be handled by default event bus error handling', () => {
         expect( errorHandlerSpy ).toHaveBeenCalled();
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a simple value', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => 42 );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS'
            }, eventOptions );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns an object with outcome ERROR', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => ({ outcome: 'ERROR', value: 42 }) );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome ERROR and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
               action: 'closeAction',
               outcome: 'ERROR',
               value: 42
            }, eventOptions );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns an object with outcome != ERROR', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => ({ outcome: 'BLARGH', value: 42 }) );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS',
               value: 42
            }, eventOptions );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns an object', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => ({ value: 42 }) );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS',
               value: 42
            }, eventOptions );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a resolved promise with simple value', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => Promise.resolve( 42 ) );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS'
            }, eventOptions );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a resolved promise with object', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => Promise.resolve( { value: 42 } ) );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS',
               value: 42
            }, eventOptions );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a resolved promise with object with outcome ERROR', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => Promise.resolve( { outcome: 'ERROR', value: 42 } ) );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome ERROR and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
               action: 'closeAction',
               outcome: 'ERROR',
               value: 42
            }, eventOptions );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a resolved promise with object with outcome != ERROR', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => Promise.resolve( { outcome: 'BLARGH', value: 42 } ) );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS',
               value: 42
            }, eventOptions );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a rejected promise with simple value', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => Promise.reject( 42 ) );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome ERROR', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
               action: 'closeAction',
               outcome: 'ERROR'
            }, eventOptions );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a rejected promise with object', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => Promise.reject( { value: 42 } ) );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome ERROR and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.ERROR', {
               action: 'closeAction',
               outcome: 'ERROR',
               value: 42
            }, eventOptions );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a rejected promise with object with outcome SUCCESS', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => Promise.reject( { outcome: 'SUCCESS', value: 42 } ) );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sends a didTakeAction with outcome SUCCESS and uses the object as event object basis', () => {
         expect( widgetEventBus.publish )
            .toHaveBeenCalledWith( 'didTakeAction.closeAction.SUCCESS', {
               action: 'closeAction',
               outcome: 'SUCCESS',
               value: 42
            }, eventOptions );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the handler returns a resolved promise with object with outcome != SUCCESS', () => {

      beforeEach( done => {
         handlerFunction.and.callFake( () => Promise.reject( { outcome: 'BLARGH', value: 42 } ) );

         registerActionsAndPublish()
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

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
