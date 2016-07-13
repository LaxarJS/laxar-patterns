/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import { create as createEventBusMock } from 'laxar/lib/testing/event_bus_mock';
import * as visibility from '../visibility';

describe( 'A visibility-event handler', () => {

   let scope;

   let onShowSpy;
   let onHideSpy;
   let onChangeSpy;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      scope = {
         eventBus: createEventBusMock(),
         widget: {
            id: 'mockWidgetId',
            area: 'mockWidgetArea'
         }
      };

      onShowSpy = jasmine.createSpy( 'onShow' );
      onHideSpy = jasmine.createSpy( 'onHide' );
      onChangeSpy = jasmine.createSpy( 'onChange' );

      visibility.handlerFor( scope, {
         onShow: onShowSpy,
         onHide: onHideSpy,
         onChange: onChangeSpy
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to didChangeAreaVisibility events for its area', () => {
      expect( scope.eventBus.subscribe ).toHaveBeenCalledWith(
         'didChangeAreaVisibility.mockWidgetArea', jasmine.any( Function ) );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to register an onShow callback', done => {
      const event = { area: 'mockWidgetArea', visible: true };
      expect( onShowSpy ).not.toHaveBeenCalled();
      scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.true', event )
         .then( () => expect( onShowSpy ).toHaveBeenCalled() )
         .then( done );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to register an onHide callback', done => {
      const showEvent = { area: 'mockWidgetArea', visible: true };
      const hideEvent = { area: 'mockWidgetArea', visible: false };
      scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent )
         .then( () => expect( onHideSpy ).not.toHaveBeenCalled() )
         .then( () => scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.true', showEvent ) )
         .then( () => scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent ) )
         .then( () => expect( onHideSpy ).toHaveBeenCalled() )
         .then( done );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to register an onChange callback', done => {
      const showEvent = { area: 'mockWidgetArea', visible: true };
      const hideEvent = { area: 'mockWidgetArea', visible: false };
      scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent )
         .then( () => expect( onChangeSpy ).not.toHaveBeenCalled() )
         .then( () => scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.true', showEvent ) )
         .then( () => expect( onChangeSpy ).toHaveBeenCalledWith( showEvent ) )
         .then( () => onChangeSpy.calls.reset() )
         .then( () => scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent ) )
         .then( () => expect( onChangeSpy ).toHaveBeenCalledWith( hideEvent ) )
         .then( done );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with onAnyAreaRequest handler', () => {

      let mockResponse;
      let onAnyAreaRequestSpy;

      beforeEach( () => {
         onAnyAreaRequestSpy = jasmine.createSpy( 'onAnyAreaRequest spy' ).and.callFake( () => {
            return mockResponse;
         } );

         visibility.handlerFor( scope, {
            onAnyAreaRequest: onAnyAreaRequestSpy
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to changeAreaVisibilityRequest events for its widget\'s areas', () => {
         expect( scope.eventBus.subscribe ).toHaveBeenCalledWith(
            'changeAreaVisibilityRequest.mockWidgetId', jasmine.any( Function ) );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'uses the callback to respond to area visibility requests', done => {
         const requestEvent = { area: 'mockWidgetId.myContent' };
         mockResponse = true;

         scope.eventBus.publish( 'changeAreaVisibilityRequest.mockWidgetId.myContent', requestEvent )
            .then( () => {
               expect( onAnyAreaRequestSpy ).toHaveBeenCalledWith( requestEvent );
               expect( scope.eventBus.publish ).toHaveBeenCalledWith(
                  `didChangeAreaVisibility.mockWidgetId.myContent.${mockResponse}`,
                  { area: 'mockWidgetId.myContent', visible: mockResponse },
                  jasmine.any( Object )
               );
            } )
            .then( () => { mockResponse = false; } )
            .then( () => {
               scope.eventBus.publish( 'changeAreaVisibilityRequest.mockWidgetId.myContent', requestEvent );
            } )
            .then( () => {
               expect( onAnyAreaRequestSpy ).toHaveBeenCalledWith( requestEvent );
               expect( scope.eventBus.publish ).toHaveBeenCalledWith(
                  `didChangeAreaVisibility.mockWidgetId.myContent.${mockResponse}`,
                  { area: 'mockWidgetId.myContent', visible: mockResponse },
                  jasmine.any( Object )
               );
            } )
            .then( done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not respond to the request the callback returns undefined', done => {
         const requestEvent = { area: 'mockWidgetId.myContent' };
         mockResponse = undefined;

         scope.eventBus.publish( 'changeAreaVisibilityRequest.mockWidgetId.myContent', requestEvent )
            .then( () => {
               expect( onAnyAreaRequestSpy ).toHaveBeenCalledWith( requestEvent );
               expect( scope.eventBus.publish ).not.toHaveBeenCalled();
            } )
            .then( done );
         scope.eventBus.publish.calls.reset();
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
         visibility.handlerFor( scope ).registerArea( 'abc', { onRequest: areaRequestSpy } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to changeAreaVisibilityRequest events for its widget\'s areas', () => {
         expect( scope.eventBus.subscribe ).toHaveBeenCalledWith(
            'changeAreaVisibilityRequest.abc', jasmine.any( Function ) );
      } );


      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'uses the callback to respond to area visibility requests', done => {
         const requestEvent = { area: 'abc' };
         mockResponse = true;

         scope.eventBus.publish( 'changeAreaVisibilityRequest.abc', requestEvent )
            .then( () => {
               expect( areaRequestSpy ).toHaveBeenCalledWith( requestEvent );
               expect( scope.eventBus.publish ).toHaveBeenCalledWith(
                  `didChangeAreaVisibility.abc.${mockResponse}`,
                  { area: 'abc', visible: mockResponse },
                  jasmine.any( Object )
               );
            } )
            .then( () => { mockResponse = false; } )
            .then( () => scope.eventBus.publish( 'changeAreaVisibilityRequest.abc', requestEvent ) )
            .then( () => {
               expect( areaRequestSpy ).toHaveBeenCalledWith( requestEvent );
               expect( scope.eventBus.publish ).toHaveBeenCalledWith(
                  `didChangeAreaVisibility.abc.${mockResponse}`,
                  { area: 'abc', visible: mockResponse },
                  jasmine.any( Object )
               );
            } )
            .then( done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not respond to the request the callback returns undefined', done => {
         const requestEvent = { area: 'abc' };
         mockResponse = undefined;

         scope.eventBus.publish( 'changeAreaVisibilityRequest.abc', requestEvent )
            .then( () => {
               expect( areaRequestSpy ).toHaveBeenCalledWith( requestEvent );
               expect( scope.eventBus.publish ).not.toHaveBeenCalled();
            } )
            .then( done );
         scope.eventBus.publish.calls.reset();
      } );

   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'An area-visibility-request publisher', () => {

   let publisher;
   let scope;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      scope = {
         eventBus: createEventBusMock(),
         widget: {
            id: 'mockWidgetId',
            area: 'mockWidgetArea'
         }
      };
      publisher = visibility.requestPublisherForArea( scope, 'xyz' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to publish visibility requests for the given area', done => {
      publisher( true )
         .then( () => {
            expect( scope.eventBus.publish ).toHaveBeenCalledWith( 'changeAreaVisibilityRequest.xyz.true', {
               area: 'xyz',
               visible: true
            }, jasmine.any( Object ) );
         } )
         .then( () => publisher( false ) )
         .then( () => {
            expect( scope.eventBus.publish ).toHaveBeenCalledWith( 'changeAreaVisibilityRequest.xyz.false', {
               area: 'xyz',
               visible: false
            }, jasmine.any( Object ) );
         } )
         .then( done );
   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'A widget-visibility-request publisher', () => {

   let publisher;
   let scope;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      scope = {
         eventBus: createEventBusMock(),
         widget: {
            id: 'mockWidgetId',
            area: 'mockWidgetArea'
         }
      };
      publisher = visibility.requestPublisherForWidget( scope );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to publish visibility requests for the given widget, as determined by scope', done => {
      publisher( true )
         .then( () => {
            expect( scope.eventBus.publish ).toHaveBeenCalledWith(
               'changeWidgetVisibilityRequest.mockWidgetId.true', {
                  widget: 'mockWidgetId',
                  visible: true
               }, jasmine.any( Object ) );
         } )
         .then( () => publisher( false ) )
         .then( () => {
            expect( scope.eventBus.publish ).toHaveBeenCalledWith(
               'changeWidgetVisibilityRequest.mockWidgetId.false', {
                  widget: 'mockWidgetId',
                  visible: false
               }, jasmine.any( Object ) );
         } )
         .then( done );
   } );

} );
