/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *takeActionRequest*, *willTakeAction* and
 * *didTakeAction* events.
 *
 * @module actions
 */
import { assert, object } from 'laxar';

/**
 * Constant for the value `"SUCCESS"` of a successful action request outcome.
 *
 * @type {String}
 * @name OUTCOME_SUCCESS
 */
export const OUTCOME_SUCCESS = 'SUCCESS';

/**
 * Constant for the value `"ERROR"` of an erronoues action request outcome.
 *
 * @type {String}
 * @name OUTCOME_ERROR
 */
export const OUTCOME_ERROR = 'ERROR';

const DELIVER_TO_SENDER = { deliverToSender: false };

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and returns a function to publish *takeActionRequest* events for an action configured as feature.
 * The action to publish is expected to be at the key `action` under the given feature path.
 * So if the given feature path is `click`, the actual name of the action is expected to be found at
 * `context.features.click.action`.
 *
 * Apart from that this function works just like {@link #publisher()}.
 *
 * @param {AxContext} context
 *    the widget context to work on
 * @param {String} feature
 *    the feature to take the action name from
 * @param {Object} [optionalOptions]
 *    options for the publisher
 * @param {Boolean} [optionalOptions.deliverToSender]
 *    the value is forwarded to `eventBus.publishAndGatherReplies`: if `true` the event will also be
 *    delivered to the publisher. Default is `false`
 * @param {Boolean} [optionalOptions.optional]
 *    if `true`, a missing feature configuration will result in a noop publisher. Else, a missing feature
 *    configuration results in a thrown error. Default is `false`
 * @param {Boolean} [optionalOptions.timeout]
 *    the value is forwarded to `eventBus.publishAndGatherReplies` as value of `pendingDidTimeout`
 * @param {Function} [optionalOptions.onSuccess]
 *    a function that is called when the overall outcome yields {@link #OUTCOME_SUCCESS}
 * @param {Function} [optionalOptions.onError]
 *    a function that is called when the overall outcome yields {@link #OUTCOME_ERROR}
 * @param {Function} [optionalOptions.onComplete]
 *    a function that is called always, independently of the overall outcome, when all events in response
 *    were received
 *
 * @return {Function}
 *    the publisher as described above
 */
export function publisherForFeature( context, feature, optionalOptions ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );

   const options = {
      optional: false,
      ...optionalOptions
   };

   const action = object.path( context.features, `${feature}.action`, null );
   if( !action ) {
      if( options.optional ) {
         return () => Promise.resolve();
      }
      assert.codeIsUnreachable( `No configuration found for non-optional action at feature ${feature}.` );
   }

   return publisher( context, action, optionalOptions );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and return a function to publish *takeActionRequest* events for a given action.
 * The outcomes of all given *didTakeAction* events are interpreted and optional callbacks according to the
 * overall outcome are called.
 * Interpretation is simple: If at least one *didTakeAction* event yields the outcome {@link #OUTCOME_ERROR},
 * the overall outcome is also erroneous.
 * In any other case the overall outcome will be successful.
 *
 * The promise returned by the publisher is resolved with an object carrying all responses and the outcome of
 * the action.
 * All `on*` handlers will only receive the list of responses to the action.
 * A response is an object having the keys `meta` and `event`, being the meta and event objects of a
 * `didTakeAction` event (see `EventBus#publishAndGatherReplies()` for details).
 *
 * Example:
 * ```js
 * publisher = actions.publisher( context, 'save', {
 *    onSuccess: () => { closeApplication(); },
 *    onError: () => { displayError(); }
 * } );
 *
 * $button.on( 'click', () => {
 *    publisher().then( result => {
 *       console.log( result ); // for example { responses: [ ... ], outcome: 'SUCCESS' }
 *    } );
 * } );
 * ```
 *
 * @param {AxContext} context
 *    the widget context to work on
 * @param {String} action
 *    the action to publish on call of the publisher
 * @param {Object} [optionalOptions]
 *    options for the publisher
 * @param {Boolean} [optionalOptions.deliverToSender]
 *    the value is forward to `eventBus.publishAndGatherReplies`: if `true` the event will also be
 *    delivered to the publisher. Default is `false`
 * @param {Boolean} [optionalOptions.timeout]
 *    the value is forwarded to `eventBus.publishAndGatherReplies` as value of `pendingDidTimeout`
 * @param {Function} [optionalOptions.onSuccess]
 *    a function that is called when the overall outcome yields {@link #OUTCOME_SUCCESS}
 * @param {Function} [optionalOptions.onError]
 *    a function that is called when the overall outcome yields {@link #OUTCOME_ERROR}
 * @param {Function} [optionalOptions.onComplete]
 *    a function that is called always, independently of the overall outcome, when all events in response
 *    were received
 *
 * @return {Function}
 *    the publisher as described above
 */
export function publisher( context, action, optionalOptions ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );
   assert( action ).hasType( String ).isNotNull();

   const options = object.options( optionalOptions, {
      deliverToSender: false,
      onSuccess: () => {},
      onError: () => {},
      onComplete: () => {}
   } );

   assert( options.onSuccess ).hasType( Function ).isNotNull();
   assert( options.onError ).hasType( Function ).isNotNull();
   assert( options.onComplete ).hasType( Function ).isNotNull();

   const eventBusOptions = {
      deliverToSender: options.deliverToSender
   };
   if( options.timeout > 0 ) {
      eventBusOptions.pendingDidTimeout = options.timeout;
   }

   return optionalEvent => {
      const event = object.options( optionalEvent, { action } );

      return context.eventBus
         .publishAndGatherReplies( `takeActionRequest.${action}`, event, eventBusOptions )
         .then( didResponses => {
            const failed = didResponses.some( response => response.event.outcome === OUTCOME_ERROR );

            options.onComplete( didResponses.slice( 0 ) );
            options[ failed ? 'onError' : 'onSuccess' ]( didResponses.slice( 0 ) );

            return {
               outcome: failed ? OUTCOME_ERROR : OUTCOME_SUCCESS,
               responses: didResponses.slice( 0 )
            };
         } );
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an action publisher for a given feature and makes it available as a context property.
 *
 * The publisher is created under ``context[ `actions.${feature}` ]``, where `context` and `feature`
 * are the arguments passed to this function. If an action topic has been configured for the given feature,
 * the action publisher is created using `publisherForFeature`. Otherwise, it is a noop-function.
 *
 * @param {AxContext} context
 *    the widget context to work on
 * @param {String} feature
 *    the feature to take the action name from
 * @param {Object} [optionalOptions]
 *    options for the publisher, as documented under `publisherForFeature`
 */
export function connectPublisherToFeature( context, feature, optionalOptions ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );

   const topic = object.path( context.features, feature );
   const publisher = topic ? publisherForFeature( context, feature, optionalOptions ) : () => {};
   object.setPath( context, `actions.${feature}`, publisher );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a new action handler instance for *takeActionRequest* events. It handles sending of an optional
 * *willTakeAction* event and the following *didTakeAction* event, possibly following asynchronously later.
 *
 * @param {AxContext} context
 *    the widget context to work on
 *
 * @return {ActionHandler}
 *    an action handler instance
 */
export function handlerFor( context ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );

   return new ActionHandler( context );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/**
 * @constructor
 * @private
 */
function ActionHandler( context ) {
   this.context = context;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Registers a handler for *takeActionRequest* events with actions from a feature. It is assumed that the
 * given feature has an `onActions` property, which is a set of actions to listen to. The set may be empty,
 * `null` or `undefined`, in which case the handler simply won't be attached to any event.
 *
 * Apart from that, this function works just like {@link ActionHandler#registerActions}.
 *
 * Example:
 * Consider the following configuration for a widget:
 * ```json
 * {
 *    "features": {
 *       "open": {
 *          "onActions": [ "openAction1", "openAction2" ]
 *       },
 *       "save": {
 *          "onActions": [ "save" ]
 *       }
 *    }
 * }
 * ```
 * An example using that would be:
 * ```js
 * actions.handlerFor( context )
 *    .registerActionsFromFeature( 'open', ( event, meta ) => {
 *       somethingSynchronous();
 *       return actions.OUTCOME_SUCCESS;
 *    } )
 *    .registerActionsFromFeature( 'save', ( event, meta ) => {
 *       return Promise.resolve( somethingAsynchronous() );
 *    } );
 * ```
 *
 * @param {String} feature
 *    the feature to read the actions to watch from
 * @param {Function} handler
 *    the handler to call whenever a *takeActionRequest* event with matching action is received
 *
 * @return {ActionHandler}
 *    this instance for chaining
 */
ActionHandler.prototype.registerActionsFromFeature = function( feature, handler ) {
   const actions = object.path( this.context.features, `${feature}.onActions` ) || [];
   return this.registerActions( actions, handler );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Registers a handler for *takeActionRequest* events for a set of actions. The set may be empty, in
 * which case the handler simply won't be attached to any event.
 *
 * The handler is assumed to be a function that receives the event and meta object of the underlying
 * *takeActionRequest* event when called. In order to send the correct *didTakeAction* event as response,
 * the return value of the handler is interpreted according to the following rules:
 *
 * - the handler throws an error
 *   - the *didTakeAction* event is sent with outcome {@link #OUTCOME_ERROR}
 *   - the error is re-thrown
 * - the handler returns a simple value or a promise, that is later resolved with a value
 *   - if the value is a plain object, it is used as basis for the event object and
 *     - if the object has a property `outcome` with value {@link #OUTCOME_ERROR}, the *didTakeAction* event
 *       is sent with outcome {@link #OUTCOME_ERROR}
 *   - otherwise, or if the value is no plain object, the *didTakeAction* event is sent with outcome
 *     {@link #OUTCOME_SUCCESS}
 * - the handler returns a promise, that is later rejected with a value
 *   - if the value is a plain object, it is used as basis for the event object and
 *     - if the object has a property `outcome` with value {@link #OUTCOME_SUCCESS}, the *didTakeAction*
 *       event is sent with outcome {@link #OUTCOME_SUCCESS}
 *   - otherwise, or if the value is no plain object, the *didTakeAction* event is sent with outcome
 *     {@link #OUTCOME_ERROR}
 *
 * So basically simple return values or resolved promises are assumed to be successful if they don't state
 * otherwise, while rejected promises are assumed to be erroneous, if they don't state otherwise.
 *
 * Example:
 * ```js
 * actions.handlerFor( context )
 *    .registerActions( [ 'open' ], ( event, meta ) => 42 )
 *    .registerActions( [ 'save' ], ( event, meta ) => Promise.resolve( { resultValue: 42 } ) );
 * ```
 *
 * @param {String[]} actions
 *    a set of actions to watch
 * @param {Function} handler
 *    the handler to call whenever a *takeActionRequest* event with matching action is received
 *
 * @return {ActionHandler}
 *    this instance for chaining
 */
ActionHandler.prototype.registerActions = function( actions, handler ) {
   assert( actions ).hasType( Array ).isNotNull();
   assert( handler ).hasType( Function ).isNotNull();

   const self = this;
   actions.forEach( action => {
      self.context.eventBus.subscribe( `takeActionRequest.${action}`, ( event, meta ) => {
         callHandler( self.context.eventBus, action, handler, event, meta );
      } );
   } );

   return this;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function callHandler( eventBus, action, handler, event, meta ) {
   eventBus.publish( `willTakeAction.${action}`, { action }, DELIVER_TO_SENDER );

   let responseEvent = { action, outcome: OUTCOME_SUCCESS };

   let returnValue;
   try {
      returnValue = handler( event, meta );
   }
   catch( error ) {
      responseEvent.outcome = OUTCOME_ERROR;

      eventBus.publish( `didTakeAction.${action}.${OUTCOME_ERROR}`, responseEvent, DELIVER_TO_SENDER );
      throw error;
   }

   Promise.resolve( returnValue )
      .then( promiseValue => {
         if( isObject( promiseValue ) ) {
            responseEvent.outcome =
               promiseValue.outcome === OUTCOME_ERROR ? OUTCOME_ERROR : OUTCOME_SUCCESS;
         }

         return promiseValue;
      }, promiseValue => {
         responseEvent.outcome = OUTCOME_ERROR;
         if( isObject( promiseValue ) ) {
            responseEvent.outcome =
               promiseValue.outcome === OUTCOME_SUCCESS ? OUTCOME_SUCCESS : OUTCOME_ERROR;
         }

         return promiseValue;
      } )
      .then( promiseValue => {
         responseEvent = object.options( responseEvent, promiseValue );
         const eventName = `didTakeAction.${action}.${responseEvent.outcome}`;
         eventBus.publish( eventName, responseEvent, DELIVER_TO_SENDER );
      } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function isObject( value ) {
   return value !== null && typeof value === 'object';
}
