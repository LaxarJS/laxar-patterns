/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *changeAreaVisibilityRequest* and
 * *didChangeAreaVisibility* events.
 *
 * @module visibility
 */
import { assert, object } from 'laxar';

/**
 * Publishes *changeWidgetVisibilityRequest* events.
 *
 * @param {AxContext} context
 *    the widget context to work on
 *
 * @return {Function}
 *    a function of boolean that requests for widget visibility to be set to the given state
 */
export function requestPublisherForWidget( context ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );

   return visible => {
      const eventName = `changeWidgetVisibilityRequest.${context.widget.id}.${visible}`;
      return context.eventBus.publishAndGatherReplies( eventName, {
         widget: context.widget.id,
         visible
      }, { deliverToSender: false } );
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Publishes *changeAreaVisibilityRequest* events.
 *
 * @param {AxContext} context
 *    the widget context to work on
 * @param {String} area
 *    the name of a widget area whose visibility is to be controlled by the function returned
 *
 * @return {Function}
 *    a function of boolean that requests for the given area's visibility to be set to the given state
 */
export function requestPublisherForArea( context, area ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );

   return visible => {
      const eventName = `changeAreaVisibilityRequest.${area}.${visible}`;
      const meta = { deliverToSender: false };
      return context.eventBus.publishAndGatherReplies( eventName, { area, visible }, meta );
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a new handler instance for *didChangeAreaVisibility* events.
 *
 * @param {AxContext} context
 *    the widget context to work on. The visibility handler will manage the boolean context property
 *    `isVisible` which can be used to determine the visibility state of the entire widget
 * @param {Object} [optionalOptions]
 *    additional options to pass to the visibility handler
 * @param {Function} [optionalOptions.onChange]
 *    a handler to call when a *didChangeAreaVisibility* request for this widget's container was received,
 *    and the visibility of this widget was changed
 * @param {Function} [optionalOptions.onShow]
 *    a handler to call when a *didChangeAreaVisibility* request for this widget's container was received,
 *    and the visibility of this widget was changed to `true`
 * @param {Function} [optionalOptions.onHide]
 *    a handler to call when a *didChangeAreaVisibility* request for this widget's container was received,
 *    and the visibility of this widget was changed to `false`
 * @param {Function} [optionalOptions.onAnyAreaRequest]
 *    a handler for any `*changeAreaVisibilityRequest* to this widget's areas
 *    The handler must
 *    - _either_ return `true`/`false` to indicate visibility synchronously
 *    - _or_ issue a will/did-response for the area when called
 *
 * @return {VisibilityHandler}
 *    a visibility handler instance
 */
export function handlerFor( context, optionalOptions ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );

   return new VisibilityHandler( context, optionalOptions );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/**
 * @constructor
 * @private
 */
function VisibilityHandler( context, optionalOptions ) {
   this.context = context;
   context.isVisible = false;

   const options = object.options( optionalOptions, {} );

   if( options.onAnyAreaRequest ) {
      const requestEvent = `changeAreaVisibilityRequest.${context.widget.id}`;
      context.eventBus.subscribe( requestEvent, responder( this, options.onAnyAreaRequest ) );
   }

   const didEvent = `didChangeAreaVisibility.${context.widget.area}`;
   context.eventBus.subscribe( didEvent, event => {
      const wasVisible = context.isVisible || false;
      context.isVisible = event.visible;
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

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Handles *changeAreaVisibilityRequest* events for a specific area, using a callback.
 *
 * @param {String} areaName
 *    the name of the area for which to handle visibility events
 * @param {Object=} optionalOptions
 *    additional options to pass to the visibility handler
 * @param {Function=} optionalOptions.onRequest
 *    a callback for any *changeAreaVisibilityRequest* to this area. The callback may issue a
 *    will/did-response for the area when called, or return a boolean which causes the visibility handler
 *    to respond accordingly. This should not be used in conjunction with the global
 *    `onAnyAreaRequest`-option of the handler
 *
 * @return {VisibilityHandler}
 *    this instance for chaining
 */
VisibilityHandler.prototype.registerArea = function( areaName, optionalOptions ) {
   const options = object.options( optionalOptions, {} );
   if( options.onRequest ) {
      const requestEvent = `changeAreaVisibilityRequest.${areaName}`;
      this.context.eventBus.subscribe( requestEvent, responder( this, options.onRequest ) );
   }
   return this;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function responder( self, callback ) {
   return event => {
      const result = callback( event );
      if( result === true || result === false ) {
         const didEvent = `didChangeAreaVisibility.${event.area}.${result}`;
         self.context.eventBus.publish( didEvent, {
            area: event.area,
            visible: result
         }, { deliverToSender: false } );
      }
   };
}
