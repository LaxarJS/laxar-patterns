/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'laxar',
   'underscore',
   './patches'
], function( ax, _, patches ) {
   'use strict';

   /**
    * Creates a new handler instance for didChangeFlag events, on which one can attach a listener for
    * accumulated flag changes. Assume for example a feature like `disableOn`, which defines a set of flags,
    * where a `true` state of any of the flags disables the widget. The developer shouldn't care about single
    * flag states but should only be notified, if a change of one flag leads to a change of the accumulated
    * "any flag should be true" state.
    *
    * Additionally it is possible to let the handler set the current state of the accumulated flag on a given
    * scope property.
    *
    * @param {Object} scope the scope the handler should work with. It is expected to find an `eventBus`
    *    property there with which it can do the event handling
    * @returns {FlagHandler} not `null`
    */
   function handlerFor( scope ) {
      return new FlagHandler( scope );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function FlagHandler( scope ) {
      this.scope_ = scope;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   FlagHandler.prototype = {

      /**
       * Registers a flag or a set of flags from the given feature. In contrast to the `ResourceHandler` here
       * the complete attribute path to the flag(s) must be provided. This is due to the fact that there is no
       * convention on names for flags on a feature, as there can coexist multiple flags for one feature, each
       * influencing a different aspect of this feature.
       *
       * @param {String} featurePath the attribute path to the configured flag(s) within the feature map
       * @param {Object=} options options and callbacks to use
       * @param {Boolean} options.initialState the optional initial state of the accumulated state. If not
       *    given each non-inverted flag is initially assumed to be `false` and `true`, if it is inverted.
       * @param {Function|Function[]} options.onChange
       *    a function or a list of functions to call whenever the accumulated state of the flags changes. It
       *    receives the new state as first argument and its previous state as second argument
       * @param {String} options.scopeKey the key to set the current accumulated state on in the scope. If not
       *    given, nothing happens. For example `flags.myFlag` would set `scope.flags.myFlag` to the currently
       *    valid accumulated state.
       * @param {String} options.predicate on of these:
       *    * `any`: if any of the flag's sates is `true`, the accumulated state is `true. This is the default
       *    * `all`: if all of the flag's states are `true`, the accumulated state is `true`
       * @returns {FlagHandler} this instance
       */
      registerFlagFromFeature: function( featurePath, options ) {
         return this.registerFlag( ax.object.path( this.scope_.features, featurePath, [] ), options );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Registers a flag or a set of flags given as argument. Even `undefined`, `null` or an empty array
       * are handled gracefully and treated as an empty set of flags, thus never changing their states.
       *
       * The new accumulated state is set on `scope.flags` if that is defined. Otherwise it is set on
       * `scope.model`.
       *
       * @param {String|String[]} possibleFlags one or more flags to watch
       * @param {Object=} options options and callbacks to use
       * @param {Boolean} options.initialState the optional initial state of the accumulated state. If not
       *    given each non-inverted flag is initially assumed to be `false` and `true`, if it is inverted.
       * @param {Function|Function[]} options.onChange
       *    a function or a list of functions to call whenever the accumuated state of the flags changes. It
       *    receives the new state as first argument and its previous state as second argument
       * @param {String} options.scopeKey the key to set the current accumulated state on in the scope. If not
       *    given, nothing happens. For example `flags.myFlag` would set `scope.flags.myFlag` to the currently
       *    valid accumulated state.
       * @param {String} options.predicate on of these:
       *    * `any`: if any of the flag's sates is `true`, the accumulated state is `true. This is the default
       *    * `all`: if all of the flag's states are `true`, the accumulated state is `true`
       * @returns {FlagHandler} this instance
       */
      registerFlag: function( possibleFlags, options ) {

         options = _.defaults( options || {}, {
            predicate: 'any'
         } );

         var applyToScope = _.identity;
         if( 'scopeKey' in options ) {
            applyToScope = function( state ) {
               patches.apply( this.scope_, _.object( [ options.scopeKey ], [ state ] ) );
            }.bind( this );
         }

         var flags = this.processFlags_( possibleFlags );
         var changeHandler = this.processChangeHandlers_( options.onChange );
         var oldState = ( typeof options.initialState === 'boolean' ) ?
            options.initialState : this.evaluateState_( flags, options.predicate );

         applyToScope( oldState );

         flags.forEach( function( flag ) {
            this.scope_.eventBus.subscribe( 'didChangeFlag.' + flag.name, function( event ) {
               flag.state = flag.negated ? !event.state : event.state;

               var newState = this.evaluateState_( flags, options.predicate );
               if( newState !== oldState ) {
                  applyToScope( newState );
                  changeHandler( newState, oldState );
                  oldState = newState;
               }
            }.bind( this ) );
         }.bind( this ) );

         return this;
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * @param {String[]} flags
       * @returns {Object[]} processed flags
       * @private
       */
      processFlags_: function( flags ) {
         if( !flags ) {
            return [];
         }

         var flagArr = _.isArray( flags ) ? flags : [ flags ];
         return flagArr.map( function( flagExpression ) {
            var negated = flagExpression.indexOf( '!' ) === 0;
            return {
               name: negated ? flagExpression.substr( 1 ) : flagExpression,
               negated: negated,
               state: negated // always the state after applying a possible negation
            };
         } );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       *
       * @param handlers
       * @returns {Function}
       * @private
       */
      processChangeHandlers_: function( handlers ) {
         if( !handlers ) {
            return function() {};
         }

         var handlerArr = _.isArray( handlers ) ? handlers : [ handlers ];
         return function( newValue, oldValue ) {
            handlerArr.forEach( function( handler ) {
               handler( newValue, oldValue );
            } );
         };
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * @param {Object[]} flags
       * @param {String} predicate one of {"any", "all"}
       * @returns {boolean}
       * @private
       */
      evaluateState_: function( flags, predicate ) {
         var state = flags.reduce( this.evaluators_[ predicate ], null );
         return state === null ? false : state;
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      evaluators_: {

         any: function( previousValue, flag ) {
            return previousValue === null ? flag.state : flag.state || previousValue;
         },

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         all: function( previousValue, flag ) {
            return previousValue === null ? flag.state : flag.state && previousValue;
         }

      }

   };

   return {
      handlerFor: handlerFor
   };

} );
