/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import * as visibility from '../visibility';
import { create as createEventBusMock } from 'laxar/lib/testing/event_bus_mock';

describe( 'A visibility-event handler', () => {

   let scope;

   let onShowSpy_;
   let onHideSpy_;
   let onChangeSpy_;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      scope = {
         eventBus: createEventBusMock(),
         widget: {
            id: 'mockWidgetId',
            area: 'mockWidgetArea'
         }
      };

      onShowSpy_ = jasmine.createSpy( 'onShow' );
      onHideSpy_ = jasmine.createSpy( 'onHide' );
      onChangeSpy_ = jasmine.createSpy( 'onChange' );

      visibility.handlerFor( scope, {
         onShow: onShowSpy_,
         onHide: onHideSpy_,
         onChange: onChangeSpy_
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
      expect( onShowSpy_ ).not.toHaveBeenCalled();
      scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.true', event )
         .then( () => expect( onShowSpy_ ).toHaveBeenCalled() )
         .then( done );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to register an onHide callback', done => {
      const showEvent = { area: 'mockWidgetArea', visible: true };
      const hideEvent = { area: 'mockWidgetArea', visible: false };
      scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent )
         .then( () => expect( onHideSpy_ ).not.toHaveBeenCalled() )
         .then( () => scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.true', showEvent ) )
         .then( () => scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent ) )
         .then( () => expect( onHideSpy_ ).toHaveBeenCalled() )
         .then( done );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'allows to register an onChange callback', done => {
      const showEvent = { area: 'mockWidgetArea', visible: true };
      const hideEvent = { area: 'mockWidgetArea', visible: false };
      scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent )
         .then( () => expect( onChangeSpy_ ).not.toHaveBeenCalled() )
         .then( () => scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.true', showEvent ) )
         .then( () => expect( onChangeSpy_ ).toHaveBeenCalledWith( showEvent ) )
         .then( () => onChangeSpy_.calls.reset() )
         .then( () => scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent ) )
         .then( () => expect( onChangeSpy_ ).toHaveBeenCalledWith( hideEvent ) )
         .then( done );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with onAnyAreaRequest handler', () => {

      let mockResponse_;
      let onAnyAreaRequestSpy_;

      beforeEach( () => {
         onAnyAreaRequestSpy_ = jasmine.createSpy( 'onAnyAreaRequest spy' ).and.callFake( () => {
            return mockResponse_;
         } );

         visibility.handlerFor( scope, {
            onAnyAreaRequest: onAnyAreaRequestSpy_
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
         mockResponse_ = true;

         scope.eventBus.publish( 'changeAreaVisibilityRequest.mockWidgetId.myContent', requestEvent )
            .then( () => {
               expect( onAnyAreaRequestSpy_ ).toHaveBeenCalledWith( requestEvent );
               expect( scope.eventBus.publish ).toHaveBeenCalledWith(
                  'didChangeAreaVisibility.mockWidgetId.myContent.' + mockResponse_,
                  { area: 'mockWidgetId.myContent', visible: mockResponse_ },
                  jasmine.any( Object )
               );
            } )
            .then( () => mockResponse_ = false )
            .then( () => scope.eventBus.publish( 'changeAreaVisibilityRequest.mockWidgetId.myContent', requestEvent ) )
            .then( () => {
               expect( onAnyAreaRequestSpy_ ).toHaveBeenCalledWith( requestEvent );
               expect( scope.eventBus.publish ).toHaveBeenCalledWith(
                  'didChangeAreaVisibility.mockWidgetId.myContent.' + mockResponse_,
                  { area: 'mockWidgetId.myContent', visible: mockResponse_ },
                  jasmine.any( Object )
               );
            } )
            .then( done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not respond to the request the callback returns undefined', done => {
         const requestEvent = { area: 'mockWidgetId.myContent' };
         mockResponse_ = undefined;

         scope.eventBus.publish( 'changeAreaVisibilityRequest.mockWidgetId.myContent', requestEvent )
            .then( () => {
               expect( onAnyAreaRequestSpy_ ).toHaveBeenCalledWith( requestEvent );
               expect( scope.eventBus.publish ).not.toHaveBeenCalled();
            } )
            .then( done );
         scope.eventBus.publish.calls.reset();
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a specific area handler', () => {

      let mockResponse_;
      let areaRequestSpy_;

      beforeEach( () => {
         areaRequestSpy_ = jasmine.createSpy( 'area request handler spy' ).and.callFake( () => {
            return mockResponse_;
         } );
         visibility.handlerFor( scope ).registerArea( 'abc', { onRequest: areaRequestSpy_ } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to changeAreaVisibilityRequest events for its widget\'s areas', () => {
         expect( scope.eventBus.subscribe ).toHaveBeenCalledWith(
            'changeAreaVisibilityRequest.abc', jasmine.any( Function ) );
      } );


      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'uses the callback to respond to area visibility requests', done => {
         const requestEvent = { area: 'abc' };
         mockResponse_ = true;

         scope.eventBus.publish( 'changeAreaVisibilityRequest.abc', requestEvent )
            .then( () => {
               expect( areaRequestSpy_ ).toHaveBeenCalledWith( requestEvent );
               expect( scope.eventBus.publish ).toHaveBeenCalledWith(
                  'didChangeAreaVisibility.abc.' + mockResponse_,
                  { area: 'abc', visible: mockResponse_ },
                  jasmine.any( Object )
               );
            } )
            .then( () => mockResponse_ = false )
            .then( () => scope.eventBus.publish( 'changeAreaVisibilityRequest.abc', requestEvent ) )
            .then( () => {
               expect( areaRequestSpy_ ).toHaveBeenCalledWith( requestEvent );
               expect( scope.eventBus.publish ).toHaveBeenCalledWith(
                  'didChangeAreaVisibility.abc.' + mockResponse_,
                  { area: 'abc', visible: mockResponse_ },
                  jasmine.any( Object )
               );
            } )
            .then( done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not respond to the request the callback returns undefined', done => {
         const requestEvent = { area: 'abc' };
         mockResponse_ = undefined;

         scope.eventBus.publish( 'changeAreaVisibilityRequest.abc', requestEvent )
            .then( () => {
               expect( areaRequestSpy_ ).toHaveBeenCalledWith( requestEvent );
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
