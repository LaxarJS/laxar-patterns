/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *takeActionRequest*, *willTakeAction* and
 * *didTakeAction* events.
 *
 * @module actions
 */
define( [
   'angular',
   'laxar'
], function( ng, ax ) {
   'use strict';

   var $q;
   ng.injector( [ 'ng' ] ).invoke( [ '$q', function( _$q_ ) {
      $q = _$q_;
   } ] );

   var NOOP = function() {};
   var DELIVER_TO_SENDER = { deliverToSender: false };

   var OUTCOME_SUCCESS = 'SUCCESS';
   var OUTCOME_ERROR = 'ERROR';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a function to publish `takeActionRequest` events for a given action feature. The
    * action to publish is expected to be at the key `action` under the given feature path.
    *
    * Apart from that this function works just like {@link publisher}.
    *
    * @param {Object} scope
    *    the scope the publisher works on. Needs at least an EventBus instance as `eventBus` property
    * @param {String} feature
    *    the feature to take the action name from
    * @param {Object} [optionalOptions]
    *    options for the publisher
    * @param {Boolean} optionalOptions.deliverToSender
    *    the value is forward to `eventBus.publishAndGatherReplies`: if `true` the event will also be
    *    delivered to the publisher. Default is `false`
    * @param {Function} optionalOptions.onSuccess
    *    a function that is called when the overall outcome yields "SUCCESS"
    * @param {Function} optionalOptions.onError
    *    a function that is called when the overall outcome yields "ERROR"
    * @param {Function} optionalOptions.onComplete
    *    a function that is called always, independently of the overall outcome
    *
    * @returns {Function}
    *    the publisher as described above
    */
   function publisherForFeature( scope, feature, optionalOptions ) {
      var action = ax.object.path( scope.features, feature + '.action', null );
      return publisher( scope, action, optionalOptions );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a function to publish `takeActionRequest` events for a given action. The outcomes of
    * all given `didTakeAction` events are interpreted and optional callbacks according to the overall outcome
    * are called. Interpretation is simple: If at least one `didTakeAction` event yields the outcome "ERROR",
    * the overall outcome is also erroneous. In any other case the overall outcome will be successful.
    *
    * The promise returned by the publisher is resolved, if the overall outcome is successful and rejected if
    * the outcome is erroneous. All callbacks, be it the `on*` handlers or the then handlers of the promise,
    * will receive the list of events and meta information of all `didTakeAction` events
    * (see `EventBus#publishAndGatherReplies()` for details).
    *
    * Example:
    * ```js
    * publisher = actions.publisher( scope, 'save', {
    *    onSuccess: function() { closeApplication(); },
    *    onError: function() { displayError(); }
    * } );
    *
    * $button.on( 'click', publisher );
    * ```
    *
    * @param {Object} scope
    *    the scope the publisher works on. Needs at least an EventBus instance as `eventBus` property
    * @param {String} action
    *    the action to publish on call of the publisher
    * @param {Object} [optionalOptions]
    *    options for the publisher
    * @param {Boolean} optionalOptions.deliverToSender
    *    the value is forward to `eventBus.publishAndGatherReplies`: if `true` the event will also be
    *    delivered to the publisher. Default is `false`
    * @param {Function} optionalOptions.onSuccess
    *    a function that is called when the overall outcome yields "SUCCESS"
    * @param {Function} optionalOptions.onError
    *    a function that is called when the overall outcome yields "ERROR"
    * @param {Function} optionalOptions.onComplete
    *    a function that is called always, independently of the overall outcome
    *
    * @returns {Function}
    *    the publisher as described above
    */
   function publisher( scope, action, optionalOptions ) {
      ax.assert( scope ).hasType( Object ).hasProperty( 'eventBus' );
      ax.assert( action ).hasType( String ).isNotNull();

      var options = ax.object.options( optionalOptions, {
         deliverToSender: false,
         onSuccess: NOOP,
         onError: NOOP,
         onComplete: NOOP
      } );

      ax.assert( options.onSuccess ).hasType( Function ).isNotNull();
      ax.assert( options.onError ).hasType( Function ).isNotNull();
      ax.assert( options.onComplete ).hasType( Function ).isNotNull();

      var eventBusOptions = {
         deliverToSender: options.deliverToSender
      };
      if( options.timeout > 0 ) {
         eventBusOptions.pendingDidTimeout = options.timeout;
      }

      return function( optionalEvent ) {
         var event = ax.object.options( optionalEvent, {
            action: action
         } );

         return scope.eventBus
            .publishAndGatherReplies( 'takeActionRequest.' + action, event, eventBusOptions )
            .then( function( didResponses ) {
               var failed = didResponses.some( function( response ) {
                  return response.event.outcome === OUTCOME_ERROR;
               } );

               options.onComplete( didResponses.slice( 0 ) );

               if( failed ) {
                  options.onError( didResponses.slice( 0 ) );
                  throw didResponses;
               }

               options.onSuccess( didResponses.slice( 0 ) );
               return didResponses;
            } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates a new action handler instance for `takeActionRequest` events. It handles sending of an optional
    * `willTakeAction` event and the final, possibly later asynchronously following `didTakeAction` event.
    *
    * @param {Object} scope
    *    the scope the handler should work with. It is expected to find an `eventBus` property there with
    *    which it can do the event handling
    *
    * @return {ActionHandler}
    *    an action handler instance
    */
   function handlerFor( scope ) {
      ax.assert( scope ).hasType( Object ).hasProperty( 'eventBus' );

      return new ActionHandler( scope );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @param scope
    *
    * @constructor
    * @private
    */
   function ActionHandler( scope ) {
      this.scope_ = scope;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers a handler for `takeActionRequest` events with actions from a feature. It is assumed that the
    * given feature has an `onActions` property, which is a set of actions to listen to. The set may be empty,
    * `null` or `undefined`, in which case the handler simply won't be attached to any event.
    *
    * Apart from that this function works just like {@link ActionHandler#registerActions}.
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
    * actions.handlerFor( scope )
    *    .registerActionsFromFeature( 'open', function( event, meta ) {
    *       somethingSynchronous();
    *       return actions.OUTCOME_SUCCESS;
    *    } )
    *    .registerActionsFromFeature( 'save', function( event, meta ) {
    *       return $q.when( somethingAsynchronous() );
    *    } );
    * ```
    *
    * @param {String} feature
    *    the feature to read the actions to watch from
    * @param {Function} handler
    *    the handler to call whenever a `takeActionRequest` event with matching action is received
    *
    * @return {ActionHandler}
    *    this instance for chaining
    */
   ActionHandler.prototype.registerActionsFromFeature = function( feature, handler ) {
      var actions = ax.object.path( this.scope_.features, feature + '.onActions' ) || [];
      return this.registerActions( actions, handler );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers a handler for `takeActionRequest` events for a set of actions. The set may be empty, in
    * which case the handler simply won't be attached to any event.
    *
    * The handler is assumed to be a function that receives the event and meta object of the underlying
    * `takeActionRequest` event when called. In order to send the correct `didTakeAction` event as response,
    * the return value of the handler is interpreted according to the following rules:
    *
    * - the handler throws an error
    *   - the `didTakeAction` event is sent with outcome `ERROR`
    *   - the error is re-thrown
    * - the handler returns a simple value or a promise, that is later resolved with a value
    *   - if the value is a plain object, it is used as basis for the event object and
    *     - if the object has a property `outcome` with value `ERROR`, the `didTakeAction` event is sent with
    *       outcome `ERROR`
    *   - otherwise, or if the value is no plain object, the `didTakeAction` event is sent with outcome
    *     `SUCCESS`
    * - the handler returns a promise, that is later rejected with a value
    *   - if the value is a plain object, it is used as basis for the event object and
    *     - if the object has a property `outcome` with value `SUCCESS`, the `didTakeAction` event is sent with
    *     outcome `SUCCESS`
    *   - otherwise, or if the value is no plain object, the `didTakeAction` event is sent with outcome `ERROR`
    *
    * So basically simple return values or resolved promises are assumed to be successful if they don't state
    * otherwise, while rejected promises are assumed to be erroneous, if they don't state otherwise.
    *
    * Example:
    * ```js
    * actions.handlerFor( scope )
    *    .registerActions( [ 'open' ], function( event, meta ) {
    *       return 42
    *    } )
    *    .registerActions( [ 'save' ], function( event, meta ) {
    *       return $q.when( { resultValue: 42 } );
    *    } );
    * ```
    *
    * @param {String[]} actions
    *    a set of actions to watch
    * @param {Function} handler
    *    the handler to call whenever a `takeActionRequest` event with matching action is received
    *
    * @return {ActionHandler}
    *    this instance for chaining
    */
   ActionHandler.prototype.registerActions = function( actions, handler ) {
      ax.assert( actions ).hasType( Array ).isNotNull();
      ax.assert( handler ).hasType( Function ).isNotNull();

      var self = this;
      actions.forEach( function( action ) {
         self.scope_.eventBus.subscribe( 'takeActionRequest.' + action, function( event, meta ) {
            callHandler( self.scope_.eventBus, action, handler, event, meta );
         } );
      } );

      return this;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function callHandler( eventBus, action, handler, event, meta ) {
      eventBus.publish( 'willTakeAction.' + action, {
         action: action
      }, DELIVER_TO_SENDER );

      var responseEvent = {
         action: action,
         outcome: OUTCOME_SUCCESS
      };

      var returnValue;
      try {
         returnValue = handler( event, meta );
      }
      catch( error ) {
         responseEvent.outcome = OUTCOME_ERROR;

         eventBus.publish( 'didTakeAction.' + action + '.' + OUTCOME_ERROR, responseEvent, DELIVER_TO_SENDER );
         throw error;
      }

      $q.when( returnValue )
         .then( function( promiseValue ) {
            if( ng.isObject( promiseValue ) ) {
               responseEvent.outcome =
                  promiseValue.outcome === OUTCOME_ERROR ? OUTCOME_ERROR : OUTCOME_SUCCESS;
            }

            return promiseValue;
         }, function( promiseValue ) {
            responseEvent.outcome = OUTCOME_ERROR;
            if( ng.isObject( promiseValue ) ) {
               responseEvent.outcome =
                  promiseValue.outcome === OUTCOME_SUCCESS ? OUTCOME_SUCCESS : OUTCOME_ERROR;
            }

            return promiseValue;
         } )
         .then( function( promiseValue ) {
            responseEvent = ax.object.options( responseEvent, promiseValue );
            var eventName = 'didTakeAction.' + action + '.' + responseEvent.outcome;
            eventBus.publish( eventName, responseEvent, DELIVER_TO_SENDER );
         } );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {
      publisher: publisher,
      publisherForFeature: publisherForFeature,
      handlerFor: handlerFor,
      OUTCOME_ERROR: OUTCOME_ERROR,
      OUTCOME_SUCCESS: OUTCOME_SUCCESS
   };

} );
