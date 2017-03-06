/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import { create as createEventBusMock } from 'laxar/lib/testing/event_bus_mock';
import * as visibility from '../visibility';

describe( 'A visibility-event handler', () => {

   let context;

   let onShowSpy;
   let onHideSpy;
   let onChangeSpy;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      context = {
         eventBus: createEventBusMock( { nextTick: _ => Promise.resolve().then( _ ) } ),
         widget: {
            id: 'mockWidgetId',
            area: 'mockWidgetArea'
         }
      };

      onShowSpy = jasmine.createSpy( 'onShow' );
      onHideSpy = jasmine.createSpy( 'onHide' );
      onChangeSpy = jasmine.createSpy( 'onChange' );

      visibility.handlerFor( context, {
         onShow: onShowSpy,
         onHide: onHideSpy,
         onChange: onChangeSpy
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to didChangeAreaVisibility events for its area', () => {
      expect( context.eventBus.subscribe ).toHaveBeenCalledWith(
         'didChangeAreaVisibility.mockWidgetArea', jasmine.any( Function ) );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to register an onShow callback', done => {
      const event = { area: 'mockWidgetArea', visible: true };
      expect( onShowSpy ).not.toHaveBeenCalled();
      context.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.true', event )
         .then( () => expect( onShowSpy ).toHaveBeenCalled() )
         .then( done, done.fail );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to register an onHide callback', done => {
      const showEvent = { area: 'mockWidgetArea', visible: true };
      const hideEvent = { area: 'mockWidgetArea', visible: false };
      context.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent )
         .then( () => expect( onHideSpy ).not.toHaveBeenCalled() )
         .then( () => context.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.true', showEvent ) )
         .then( () => context.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent ) )
         .then( () => expect( onHideSpy ).toHaveBeenCalled() )
         .then( done, done.fail );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to register an onChange callback', done => {
      const showEvent = { area: 'mockWidgetArea', visible: true };
      const hideEvent = { area: 'mockWidgetArea', visible: false };
      context.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent )
         .then( () => expect( onChangeSpy ).not.toHaveBeenCalled() )
         .then( () => context.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.true', showEvent ) )
         .then( () => expect( onChangeSpy ).toHaveBeenCalledWith( showEvent ) )
         .then( () => onChangeSpy.calls.reset() )
         .then( () => context.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent ) )
         .then( () => expect( onChangeSpy ).toHaveBeenCalledWith( hideEvent ) )
         .then( done, done.fail );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with onAnyAreaRequest handler', () => {

      let mockResponse;
      let onAnyAreaRequestSpy;

      beforeEach( () => {
         onAnyAreaRequestSpy = jasmine.createSpy( 'onAnyAreaRequest spy' ).and.callFake( () => {
            return mockResponse;
         } );

         visibility.handlerFor( context, {
            onAnyAreaRequest: onAnyAreaRequestSpy
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to changeAreaVisibilityRequest events for its widget\'s areas', () => {
         expect( context.eventBus.subscribe ).toHaveBeenCalledWith(
            'changeAreaVisibilityRequest.mockWidgetId', jasmine.any( Function ) );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'uses the callback to respond to area visibility requests', done => {
         const requestEvent = { area: 'mockWidgetId.myContent' };
         mockResponse = true;

         context.eventBus.publish( 'changeAreaVisibilityRequest.mockWidgetId.myContent', requestEvent )
            .then( () => {
               expect( onAnyAreaRequestSpy ).toHaveBeenCalledWith( requestEvent );
               expect( context.eventBus.publish ).toHaveBeenCalledWith(
                  `didChangeAreaVisibility.mockWidgetId.myContent.${mockResponse}`,
                  { area: 'mockWidgetId.myContent', visible: mockResponse },
                  jasmine.any( Object )
               );
            } )
            .then( () => { mockResponse = false; } )
            .then( () =>
               context.eventBus.publish( 'changeAreaVisibilityRequest.mockWidgetId.myContent', requestEvent )
            )
            .then( () => {
               expect( onAnyAreaRequestSpy ).toHaveBeenCalledWith( requestEvent );
               expect( context.eventBus.publish ).toHaveBeenCalledWith(
                  `didChangeAreaVisibility.mockWidgetId.myContent.${mockResponse}`,
                  { area: 'mockWidgetId.myContent', visible: mockResponse },
                  jasmine.any( Object )
               );
            } )
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not respond to the request the callback returns undefined', done => {
         const requestEvent = { area: 'mockWidgetId.myContent' };
         mockResponse = undefined;

         context.eventBus.publish( 'changeAreaVisibilityRequest.mockWidgetId.myContent', requestEvent )
            .then( () => {
               expect( onAnyAreaRequestSpy ).toHaveBeenCalledWith( requestEvent );
               expect( context.eventBus.publish ).not.toHaveBeenCalled();
            } )
            .then( done, done.fail );
         context.eventBus.publish.calls.reset();
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a specific area handler', () => {

      let mockResponse;
      let areaRequestSpy;

      beforeEach( () => {
         areaRequestSpy = jasmine.createSpy( 'area request handler spy' ).and.callFake( () => {
            return mockResponse;
         } );
         visibility.handlerFor( context ).registerArea( 'abc', { onRequest: areaRequestSpy } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to changeAreaVisibilityRequest events for its widget\'s areas', () => {
         expect( context.eventBus.subscribe ).toHaveBeenCalledWith(
            'changeAreaVisibilityRequest.abc', jasmine.any( Function ) );
      } );


      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'uses the callback to respond to area visibility requests', done => {
         const requestEvent = { area: 'abc' };
         mockResponse = true;

         context.eventBus.publish( 'changeAreaVisibilityRequest.abc', requestEvent )
            .then( () => {
               expect( areaRequestSpy ).toHaveBeenCalledWith( requestEvent );
               expect( context.eventBus.publish ).toHaveBeenCalledWith(
                  `didChangeAreaVisibility.abc.${mockResponse}`,
                  { area: 'abc', visible: mockResponse },
                  jasmine.any( Object )
               );
            } )
            .then( () => { mockResponse = false; } )
            .then( () => context.eventBus.publish( 'changeAreaVisibilityRequest.abc', requestEvent ) )
            .then( () => {
               expect( areaRequestSpy ).toHaveBeenCalledWith( requestEvent );
               expect( context.eventBus.publish ).toHaveBeenCalledWith(
                  `didChangeAreaVisibility.abc.${mockResponse}`,
                  { area: 'abc', visible: mockResponse },
                  jasmine.any( Object )
               );
            } )
            .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not respond to the request the callback returns undefined', done => {
         const requestEvent = { area: 'abc' };
         mockResponse = undefined;

         context.eventBus.publish( 'changeAreaVisibilityRequest.abc', requestEvent )
            .then( () => {
               expect( areaRequestSpy ).toHaveBeenCalledWith( requestEvent );
               expect( context.eventBus.publish ).not.toHaveBeenCalled();
            } )
            .then( done, done.fail );
         context.eventBus.publish.calls.reset();
      } );

   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'An area-visibility-request publisher', () => {

   let publisher;
   let context;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      context = {
         eventBus: createEventBusMock( { nextTick: _ => Promise.resolve().then( _ ) } ),
         widget: {
            id: 'mockWidgetId',
            area: 'mockWidgetArea'
         }
      };
      publisher = visibility.requestPublisherForArea( context, 'xyz' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to publish visibility requests for the given area', done => {
      publisher( true )
         .then( () => {
            expect( context.eventBus.publish ).toHaveBeenCalledWith( 'changeAreaVisibilityRequest.xyz.true', {
               area: 'xyz',
               visible: true
            }, jasmine.any( Object ) );
         } )
         .then( () => publisher( false ) )
         .then( () => {
            expect( context.eventBus.publish )
               .toHaveBeenCalledWith( 'changeAreaVisibilityRequest.xyz.false', {
                  area: 'xyz',
                  visible: false
               }, jasmine.any( Object ) );
         } )
         .then( done, done.fail );
   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'A widget-visibility-request publisher', () => {

   let publisher;
   let context;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      context = {
         eventBus: createEventBusMock( { nextTick: _ => Promise.resolve().then( _ ) } ),
         widget: {
            id: 'mockWidgetId',
            area: 'mockWidgetArea'
         }
      };
      publisher = visibility.requestPublisherForWidget( context );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to publish visibility requests for the given widget, as determined by context', done => {
      publisher( true )
         .then( () => {
            expect( context.eventBus.publish ).toHaveBeenCalledWith(
               'changeWidgetVisibilityRequest.mockWidgetId.true', {
                  widget: 'mockWidgetId',
                  visible: true
               }, jasmine.any( Object ) );
         } )
         .then( () => publisher( false ) )
         .then( () => {
            expect( context.eventBus.publish ).toHaveBeenCalledWith(
               'changeWidgetVisibilityRequest.mockWidgetId.false', {
                  widget: 'mockWidgetId',
                  visible: false
               }, jasmine.any( Object ) );
         } )
         .then( done, done.fail );
   } );

} );
