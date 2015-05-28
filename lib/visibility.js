/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *changeAreaVisibilityRequest* and
 * *didChangeAreaVisibility* events.
 *
 * @module visibility
 */
define( [
   'laxar'
], function( ax ) {
   'use strict';

   /**
    * Creates a new handler instance for `didChangeAreaVisibility` events.
    *
    * @param {Object} scope
    *    the scope the handler should work with. It is expected to find an `eventBus` property there with
    *    which it can do the event handling. The visibility handler will manage the boolean scope property
    *    `isVisible` which can be used to determine the visibility state of the entire widget
    * @param {Object} [optionalOptions]
    *    additional options to pass to the visibility handler
    * @param {Function} optionalOptions.onChange
    *    a handler to call when a `didChangeAreaVisibility` request for this widget's container was received,
    *    and the visibility of this widget was changed
    * @param {Function} optionalOptions.onShow
    *    a handler to call when a `didChangeAreaVisibility` request for this widget's container was received,
    *    and the visibility of this widget was changed to `true`
    * @param {Function} optionalOptions.onHide
    *    a handler to call when a `didChangeAreaVisibility` request for this widget's container was received,
    *    and the visibility of this widget was changed to `false`
    * @param {Function} optionalOptions.onAnyAreaRequest
    *    a handler for any `changeAreaVisibilityRequest` to this widget's areas
    *    The handler must
    *     * _either_ return `true`/`false` to indicate visibility synchronously
    *     * _or_ issue a will/did-response for the area when called
    *
    * @return {VisibilityHandler}
    *    a visibility handler instance
    */
   function handlerFor( scope, optionalOptions ) {
      return new VisibilityHandler( scope, optionalOptions );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @param scope
    * @param optionalOptions
    *
    * @constructor
    * @private
    */
   function VisibilityHandler( scope, optionalOptions ) {
      this.scope_ = scope;
      scope.isVisible = false;

      var options = ax.object.options( optionalOptions, {} );

      if( options.onAnyAreaRequest ) {
         var requestEvent = [ 'changeAreaVisibilityRequest', scope.widget.id ].join( '.' );
         scope.eventBus.subscribe( requestEvent, responder( this, options.onAnyAreaRequest ) );
      }

      var didEvent = [ 'didChangeAreaVisibility', scope.widget.area ].join( '.' );
      scope.eventBus.subscribe( didEvent, function( event ) {
         var wasVisible = scope.isVisible || false;
         scope.isVisible = event.visible;
         if( wasVisible === event.visible ) {
            return;
         }
         if( options.onChange ) {
            options.onChange( event );
         }
         if( options.onShow && event.visible ) {
            options.onShow( event );
         }
         else if( options.onHide && !event.visible ) {
            options.onHide( event );
         }
      } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Handle change-visibility-requests for a specific area, using a callback.
    *
    * @param {String} areaName
    *    the name of the area for which to handle visibility events
    * @param {Object=} optionalOptions
    *    additional options to pass to the visibility handler
    * @param {Function=} optionalOptions.onRequest
    *    a callback for any `changeAreaVisibilityRequest` to this area. The callback may issue a
    *    will/did-response for the area when called, or return a boolean which causes the visibility handler
    *    to respond accordingly. This should not be used in conjunction with the global
    *    `onAnyAreaRequest`-option of the handler
    *
    * @return {VisibilityHandler}
    *    this instance for chaining
    */
   VisibilityHandler.prototype.registerArea = function( areaName, optionalOptions ) {
      var options = ax.object.options( optionalOptions, {} );
      if( options.onRequest ) {
         var requestEvent = [ 'changeAreaVisibilityRequest', areaName ].join( '.' );
         this.scope_.eventBus.subscribe( requestEvent,responder( this, options.onRequest ) );
      }
      return this;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function responder( self, callback ) {
      return function( event ) {
         var result = callback( event );
         if( result === true || result === false ) {
            var didEvent = [ 'didChangeAreaVisibility', event.area, result ].join( '.' );
            self.scope_.eventBus.publish( didEvent, {
               area: event.area,
               visible: result
            }, { deliverToSender: false } );
         }
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Publishes `changeWidgetVisibilityRequest` events.
    *
    * @param {Object} scope
    *    a scope (with `widget` and `eventBus` properties)
    *
    * @return {Function}
    *    a function of boolean that requests for widget visibility to be set to the given state
    */
   function requestPublisherForWidget( scope ) {
      return function publish( visible ) {
         var eventName = [ 'changeWidgetVisibilityRequest', scope.widget.id, visible ].join( '.' );
         return scope.eventBus.publishAndGatherReplies( eventName, {
            widget: scope.widget.id,
            visible: visible
         }, { deliverToSender: false } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Publishes `changeAreaVisibilityRequest` events.
    *
    * @param {Object} scope
    *    a scope (with an `eventBus` property)
    * @param {String} area
    *    the name of a widget area whose visibility is to be controlled by the function returned
    *
    * @return {Function}
    *    a function of boolean that requests for the given area's visibility to be set to the given state
    */
   function requestPublisherForArea( scope, area ) {
      return function publish( visible ) {
         var eventName = [ 'changeAreaVisibilityRequest', area, visible ].join( '.' );
         return scope.eventBus.publishAndGatherReplies( eventName, {
            area: area,
            visible: visible
         }, { deliverToSender: false } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      handlerFor: handlerFor,
      requestPublisherForWidget: requestPublisherForWidget,
      requestPublisherForArea: requestPublisherForArea
   };

} );
