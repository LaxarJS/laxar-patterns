/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../visibility',
   'laxar/laxar_testing'
], function( visibility, ax ) {
   'use strict';

   describe( 'A visibility-event handler', function() {

      var handler;
      var scope;

      var onShowSpy_;
      var onHideSpy_;
      var onChangeSpy_;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( function() {
         scope = {
            eventBus: ax.testing.portalMocks.mockEventBus(),
            widget: {
               id: 'mockWidgetId',
               area: 'mockWidgetArea'
            }
         };

         onShowSpy_ = jasmine.createSpy( 'onShow' );
         onHideSpy_ = jasmine.createSpy( 'onHide' );
         onChangeSpy_ = jasmine.createSpy( 'onChange' );

         handler = visibility.handlerFor( scope, {
            onShow: onShowSpy_,
            onHide: onHideSpy_,
            onChange: onChangeSpy_
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to didChangeAreaVisibility events for its area', function() {
         expect( scope.eventBus.subscribe ).toHaveBeenCalledWith(
            'didChangeAreaVisibility.mockWidgetArea', jasmine.any( Function ) );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to register an onShow callback', function() {
         var event = { area: 'mockWidgetArea', visible: true };
         scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.true', event );
         expect( onShowSpy_ ).not.toHaveBeenCalled();
         jasmine.Clock.tick( 0 );
         expect( onShowSpy_ ).toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to register an onHide callback', function() {
         var showEvent = { area: 'mockWidgetArea', visible: true };
         var hideEvent = { area: 'mockWidgetArea', visible: false };
         scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent );
         jasmine.Clock.tick( 0 );
         // no change from default:
         expect( onHideSpy_ ).not.toHaveBeenCalled();
         scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.true', showEvent );
         jasmine.Clock.tick( 0 );
         scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent );
         jasmine.Clock.tick( 0 );
         expect( onHideSpy_ ).toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to register an onChange callback', function() {
         var showEvent = { area: 'mockWidgetArea', visible: true };
         var hideEvent = { area: 'mockWidgetArea', visible: false };
         scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent );
         jasmine.Clock.tick( 0 );
         // no change from default:
         expect( onChangeSpy_ ).not.toHaveBeenCalled();
         scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.true', showEvent );
         jasmine.Clock.tick( 0 );
         expect( onChangeSpy_ ).toHaveBeenCalledWith( showEvent );
         onChangeSpy_.reset();
         scope.eventBus.publish( 'didChangeAreaVisibility.mockWidgetArea.false', hideEvent );
         jasmine.Clock.tick( 0 );
         expect( onChangeSpy_ ).toHaveBeenCalledWith( hideEvent );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with onAnyAreaRequest handler', function() {

         var mockResponse_;
         var onAnyAreaRequestSpy_;

         beforeEach( function() {
            onAnyAreaRequestSpy_ = jasmine.createSpy( 'onAnyAreaRequest spy' ).andCallFake( function() {
               return mockResponse_;
            } );

            handler = visibility.handlerFor( scope, {
               onAnyAreaRequest: onAnyAreaRequestSpy_
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'subscribes to changeAreaVisibilityRequest events for its widget\'s areas', function() {
            expect( scope.eventBus.subscribe ).toHaveBeenCalledWith(
               'changeAreaVisibilityRequest.mockWidgetId', jasmine.any( Function ) );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses the callback to respond to area visibility requests', function() {
            var requestEvent = { area: 'mockWidgetId.myContent' };

            scope.eventBus.publish( 'changeAreaVisibilityRequest.mockWidgetId.myContent', requestEvent );
            mockResponse_ = true;
            jasmine.Clock.tick( 0 );
            expect( onAnyAreaRequestSpy_ ).toHaveBeenCalledWith( requestEvent );
            expect( scope.eventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.mockWidgetId.myContent.' + mockResponse_,
               { area: 'mockWidgetId.myContent', visible: mockResponse_ },
               jasmine.any( Object )
            );

            scope.eventBus.publish( 'changeAreaVisibilityRequest.mockWidgetId.myContent', requestEvent );
            mockResponse_ = false;
            jasmine.Clock.tick( 0 );
            expect( onAnyAreaRequestSpy_ ).toHaveBeenCalledWith( requestEvent );
            expect( scope.eventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.mockWidgetId.myContent.' + mockResponse_,
               { area: 'mockWidgetId.myContent', visible: mockResponse_ },
               jasmine.any( Object )
            );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not respond to the request the callback returns undefined', function() {
            var requestEvent = { area: 'mockWidgetId.myContent' };

            scope.eventBus.publish( 'changeAreaVisibilityRequest.mockWidgetId.myContent', requestEvent );
            scope.eventBus.publish.reset();
            mockResponse_ = undefined;
            jasmine.Clock.tick( 0 );
            expect( onAnyAreaRequestSpy_ ).toHaveBeenCalledWith( requestEvent );
            expect( scope.eventBus.publish ).not.toHaveBeenCalled();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a specific area handler', function() {

         var mockResponse_;
         var areaRequestSpy_;

         beforeEach( function() {
            areaRequestSpy_ = jasmine.createSpy( 'area request handler spy' ).andCallFake( function() {
               return mockResponse_;
            } );
            handler = visibility.handlerFor( scope ).registerArea( 'abc', { onRequest: areaRequestSpy_ } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'subscribes to changeAreaVisibilityRequest events for its widget\'s areas', function() {
            expect( scope.eventBus.subscribe ).toHaveBeenCalledWith(
               'changeAreaVisibilityRequest.abc', jasmine.any( Function ) );
         } );


         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses the callback to respond to area visibility requests', function() {
            var requestEvent = { area: 'abc' };

            scope.eventBus.publish( 'changeAreaVisibilityRequest.abc', requestEvent );
            mockResponse_ = true;
            jasmine.Clock.tick( 0 );
            expect( areaRequestSpy_ ).toHaveBeenCalledWith( requestEvent );
            expect( scope.eventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.abc.' + mockResponse_,
               { area: 'abc', visible: mockResponse_ },
               jasmine.any( Object )
            );

            scope.eventBus.publish( 'changeAreaVisibilityRequest.abc', requestEvent );
            mockResponse_ = false;
            jasmine.Clock.tick( 0 );
            expect( areaRequestSpy_ ).toHaveBeenCalledWith( requestEvent );
            expect( scope.eventBus.publish ).toHaveBeenCalledWith(
               'didChangeAreaVisibility.abc.' + mockResponse_,
               { area: 'abc', visible: mockResponse_ },
               jasmine.any( Object )
            );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not respond to the request the callback returns undefined', function() {
            var requestEvent = { area: 'abc' };

            scope.eventBus.publish( 'changeAreaVisibilityRequest.abc', requestEvent );
            scope.eventBus.publish.reset();
            mockResponse_ = undefined;
            jasmine.Clock.tick( 0 );
            expect( areaRequestSpy_ ).toHaveBeenCalledWith( requestEvent );
            expect( scope.eventBus.publish ).not.toHaveBeenCalled();
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'An area-visibility-request publisher', function() {

      var publisher;
      var scope;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( function() {
         scope = {
            eventBus: ax.testing.portalMocks.mockEventBus(),
            widget: {
               id: 'mockWidgetId',
               area: 'mockWidgetArea'
            }
         };
         publisher = visibility.requestPublisherForArea( scope, 'xyz' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to publish visibility requests for the given area', function() {
         publisher( true );
         jasmine.Clock.tick( 0 );
         expect( scope.eventBus.publish ).toHaveBeenCalledWith( 'changeAreaVisibilityRequest.xyz.true', {
            area: 'xyz',
            visible: true
         }, jasmine.any( Object ) );

         publisher( false );
         jasmine.Clock.tick( 0 );
         expect( scope.eventBus.publish ).toHaveBeenCalledWith( 'changeAreaVisibilityRequest.xyz.false', {
            area: 'xyz',
            visible: false
         }, jasmine.any( Object ) );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A widget-visibility-request publisher', function() {

      var publisher;
      var scope;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( function() {
         scope = {
            eventBus: ax.testing.portalMocks.mockEventBus(),
            widget: {
               id: 'mockWidgetId',
               area: 'mockWidgetArea'
            }
         };
         publisher = visibility.requestPublisherForWidget( scope );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to publish visibility requests for the given widget, as determined by scope', function() {
         publisher( true );
         jasmine.Clock.tick( 0 );
         expect( scope.eventBus.publish ).toHaveBeenCalledWith(
            'changeWidgetVisibilityRequest.mockWidgetId.true', {
               widget: 'mockWidgetId',
               visible: true
            }, jasmine.any( Object ) );

         publisher( false );
         jasmine.Clock.tick( 0 );
         expect( scope.eventBus.publish ).toHaveBeenCalledWith(
            'changeWidgetVisibilityRequest.mockWidgetId.false', {
               widget: 'mockWidgetId',
               visible: false
            }, jasmine.any( Object ) );
      } );

   } );

} );
