/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'laxar'
], function( ax ) {
   'use strict';

   var NOOP = function() {};
   var DELIVER_TO_SENDER = { deliverToSender: false };

   /**
    * The outcome for a successfully executed action.
    *
    * @type {String}
    */
   var OUTCOME_SUCCESS = 'SUCCESS';

   /**
    * The outcome for the failed execution of an action.
    *
    * @type {String}
    */
   var OUTCOME_ERROR = 'ERROR';

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a function to publish `takeActionRequest` events for a given action feature. The
    * action to publish is expected to at the key `action` under the given feature path.
    *
    * Apart from that this function works just like `publisher()`.
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
    * The promise returned by the publisher is resolved if the overall outcome is successful and rejected if
    * the outcome is erroneous. All callbacks, be it the `on*` handlers or the then handlers of the promise,
    * will receive the list of events and meta information of all `didTakeAction` events
    * (see `EventBus#publishAndGatherReplies()` for details).
    *
    * Example:
    * ```
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
    * Creates a new handler instance for `takeActionRequest` events. It handles sending of an optional
    * `willTakeAction` event and the final, possibly later asynchronously following `didTakeAction` event.
    *
    * @param {Object} scope
    *    the scope the handler should work with. It is expected to find an `eventBus`
    *    property there with which it can do the event handling
    *
    * @return {ActionHandler}
    *    not `null`
    */
   function handlerFor( scope ) {
      ax.assert( scope ).hasType( Object ).hasProperty( 'eventBus' );

      return new ActionHandler( scope );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function ActionHandler( scope ) {
      this.scope_ = scope;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers a handler for `takeActionRequest` event with actions from a feature. It is assumed that the
    * given feature has a `onActions` property which is a set of actions to listen to. The set may be empty,
    * `null` or `undefined` in which case the handler simply won't be attached to any event.
    *
    * Apart from that this function works just like `ActionHandler#registerActions()`.
    *
    * Example:
    * Consider the following configuration:
    * ```
    *     features: {
    *        open: {
    *           onActions: [ 'openAction1', 'openAction2' ]
    *        },
    *        save: {
    *           onActions: [ 'save' ]
    *        }
    *     }
    * ```
    * An example using that would be:
    * ```
    * actions.handlerFor( scope )
    *    .registerActionsFromFeature( 'open', function( event, meta ) {
    *       somethingSynchronous();
    *       return actions.OUTCOME_SUCCESS;
    *    } )
    *    .registerActionsFromFeature( 'save', function( event, meta, done ) {
    *       somethingAsynchronous()
    *          .then( function() {
    *             done( actions.OUTCOME_SUCCESS );
    *          }, function() {
    *             done( actions.OUTCOME_ERROR );
    *          } );
    *    }, {
     *      async: true
     *   } );
    * ```
    *
    * @param {String} feature
    *    the feature to read the actions to watch from
    * @param {Function} handler
    *    the handler to call whenever a `takeActionRequest` event with matching action is received
    * @param {Object} [optionalOptions]
    *    options
    * @param {Boolean} optionalOptions.async
    *    if `true` the handler is assumed to be asynchronous and is treated as explained in the method comment.
    *    Default is `false`
    *
    * @return {ActionHandler}
    *    this instance for chaining
    */
   ActionHandler.prototype.registerActionsFromFeature = function( feature, handler, optionalOptions ) {
      var actions = ax.object.path( this.scope_.features, feature + '.onActions' ) || [];
      return this.registerActions( actions, handler, optionalOptions );
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Registers a handler for `takeActionRequest` event for a set of actions. The set may be empty, in
    * which case the handler simply won't be attached to any event.
    *
    * The handler is assumed to be a function that receives the event and meta object of the underlying
    * `takeActionRequest` event when called. In case the handler is marked as asynchronous (via tha according
    * option), it additionally receives a *done* callback as third argument. Either this must be called when
    * the asynchronous task is finished or alternatively the callback must return a promise. To deliver its
    * outcome a synchronous handler can simply return the string `'SUCCESS'` or `'ERROR'`, while the
    * asynchronous handler either needs to pass the string to the *done* callback as first argument or when
    * returning a promise resolve it in case of success and otherwise reject it. In any case, if the handler
    * throws an exception (of course not within asynchronous code) this is treated as outcome `'ERROR'` and
    * the thrown exception will be rethrown to be handled by the default event bus error handler. Any outcome
    * that is not `'SUCCESS'` or `'ERROR'` is treated as `'SUCCESS'`.
    *
    * In any case when the handler has finished its job, the according `didTakeAction` event with the
    * produced outcome is published. In case of an asynchronous handler a `willTakeAction` event is published
    * in advance.
    *
    * Example:
    * ```
    * actions.handlerFor( scope )
    *    .registerActions( [ 'open' ], function( event, meta ) {
    *       somethingSynchronous();
    *       return actions.OUTCOME_SUCCESS;
    *    } )
    *    .registerActions( [ 'save' ], function( event, meta, done ) {
    *       somethingAsynchronous()
    *          .then( function() {
    *             done( actions.OUTCOME_SUCCESS );
    *          }, function() {
    *             done( actions.OUTCOME_ERROR );
    *          } );
    *    }, {
     *      async: true
     *   } );
    * ```
    *
    * Alternatively directly return a promise:
    * ```
    * actions.handlerFor( scope )
    *    .registerActions( [ 'open' ], function( event, meta ) {
    *       somethingSynchronous();
    *       return actions.OUTCOME_SUCCESS;
    *    } )
    *    .registerActions( [ 'save' ], function( event, meta, done ) {
    *       return somethingAsynchronous();
    *    }, {
     *      async: true
     *   } );
    * ```
    *
    * In case of a successful outcome, it is also possible to return an object in the synchronous case or, in
    * case of an asynchronous handler, pass an object to the `done`-callback or the promise resolve function
    * respectively. This object will the be used as the blueprint for the event object of the `didTakeAction`
    * event.
    *
    * Example:
    * ```
    * actions.handlerFor( scope )
    *    .registerActions( [ 'open' ], function( event, meta ) {
    *       somethingSynchronous();
    *       return { response: 42 };
    *    } )
    *    .registerActions( [ 'save' ], function( event, meta, done ) {
    *       somethingAsynchronous()
    *          .then( function() {
    *             done( { response: 42 } );
    *          }, function() {
    *             done( actions.OUTCOME_ERROR );
    *          } );
    *    }, {
     *      async: true
     *   } )
    *    .registerActions( [ 'save' ], function( event, meta, done ) {
    *       return q.when( { response: 42 } );
    *    }, {
     *      async: true
     *   } );
    * ```
    *
    * @param {String[]} actions
    *    a set of actions to watch
    * @param {Function} handler
    *    the handler to call whenever a `takeActionRequest` event with matching action is received
    * @param {Object} [optionalOptions]
    *    options
    * @param {Boolean} optionalOptions.async
    *    if `true` the handler is assumed to be asynchronous and is treated as explained in the method comment.
    *    Default is `false`
    *
    * @return {ActionHandler}
    *    this instance for chaining
    */
   ActionHandler.prototype.registerActions = function( actions, handler, optionalOptions ) {
      ax.assert( actions ).hasType( Array ).isNotNull();
      ax.assert( handler ).hasType( Function ).isNotNull();

      var options = ax.object.options( optionalOptions, {
         async: false
      } );

      var self = this;
      actions.forEach( function( action ) {
         self.scope_.eventBus.subscribe( 'takeActionRequest.' + action, function( event, meta ) {
            if( options.async ) {
               callAsynchronousHandler( self.scope_.eventBus, action, handler, event, meta );
            }
            else {
               callSynchronousHandler( self.scope_.eventBus, action, handler, event, meta );
            }
         } );
      } );

      return this;
   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function callSynchronousHandler( eventBus, action, handler, event, meta ) {
      var returnValue;
      var exception;
      try {
         returnValue = handler( event, meta );
      }
      catch( e ) {
         exception = e;
      }

      var responseEvent = deriveDidEventFromOutcomeOrEvent( returnValue, action, exception );
      var eventName = 'didTakeAction.' + action + '.' + responseEvent.outcome;
      eventBus.publish( eventName, responseEvent, DELIVER_TO_SENDER );

      if( exception ) {
         throw exception;
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function callAsynchronousHandler( eventBus, action, handler, event, meta ) {
      eventBus.publish( 'willTakeAction.' + action, {
         action: action
      }, DELIVER_TO_SENDER );

      try {
         var possiblePromise = handler( event, meta, done );
         if( possiblePromise && typeof possiblePromise.then === 'function' ) {
            possiblePromise
               .then( function( optionalResult ) {
                  done( optionalResult === undefined ? OUTCOME_SUCCESS : optionalResult );
               }, function( optionalResult ) {
                  done( optionalResult === undefined ? OUTCOME_ERROR : optionalResult );
               } );
         }
      }
      catch( e ) {
         eventBus.publish( 'didTakeAction.' + action + '.'  + OUTCOME_ERROR, {
            action: action,
            outcome: OUTCOME_ERROR
         }, DELIVER_TO_SENDER );
         throw e;
      }

      var called = false;
      function done( outcomeOrEvent ) {
         if( called ) { return; }
         called = true;

         var event = deriveDidEventFromOutcomeOrEvent( outcomeOrEvent, action )
         eventBus.publish( 'didTakeAction.' + action + '.'  + event.outcome, event, DELIVER_TO_SENDER );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function deriveDidEventFromOutcomeOrEvent( outcomeOrEvent, action, optionalException ) {
      var responseEvent = {
         action: action,
         outcome: OUTCOME_SUCCESS
      };

      if( outcomeOrEvent === OUTCOME_ERROR || optionalException ) {
         responseEvent.outcome = OUTCOME_ERROR;
      }
      else if( typeof outcomeOrEvent === 'object' ) {
         responseEvent = ax.object.options( outcomeOrEvent, responseEvent );
      }

      return responseEvent;
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
