/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *didChangeFlag* events.
 *
 * @module flags
 */
import { object } from 'laxar';

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
 * @param {Object} scope
 *    the scope the handler should work with. It is expected to find an `eventBus` property there with
 *    which it can do the event handling
 *
 * @return {FlagHandler}
 *    a flag handler instance
 */
function handlerFor( scope ) {
   return new FlagHandler( scope );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/**
 *
 * @param scope
 *
 * @constructor
 * @private
 */
function FlagHandler( scope ) {
   this.scope = scope;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Registers a flag or a set of flags from the given feature. In contrast to the `ResourceHandler` here
 * the complete attribute path to the flag(s) must be provided. This is due to the fact that there is no
 * convention on names for flags on a feature, as there can coexist multiple flags for one feature, each
 * influencing a different aspect of this feature.
 *
 * @param {String} featurePath
 *    the attribute path to the configured flag(s) within the feature map
 * @param {Object|Function} [optionalOptions]
 *    options and callbacks to use. If a function is passed, it is used as the `onChange` option.
 * @param {Boolean} optionalOptions.initialState
 *    the optional initial state of the accumulated state. If not given each non-inverted flag is initially
 *    assumed to be `false` and `true`, if it is inverted
 * @param {Function|Function[]} optionalOptions.onChange
 *    a function or a list of functions to call whenever the accumulated state of the flags changes. It
 *    receives the new state as first argument and its previous state as second argument
 * @param {String} optionalOptions.scopeKey
 *    the key to set the current accumulated state on in the scope. If not given, nothing happens. For
 *    example `flags.myFlag` would set `scope.flags.myFlag` to the currently valid accumulated state
 * @param {String} optionalOptions.predicate
 *    one of these:
 *    - `any`: if any of the flag's states is `true`, the accumulated state is `true`. This is the default
 *    - `all`: if all of the flag's states are `true`, the accumulated state is `true`
 *
 * @return {FlagHandler}
 *    this instance for chaining
 */
FlagHandler.prototype.registerFlagFromFeature = function( featurePath, optionalOptions ) {
   return this.registerFlag( object.path( this.scope.features, featurePath, [] ), optionalOptions );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Registers a flag or a set of flags given as argument. Even `undefined`, `null` or an empty array
 * are handled gracefully and treated as an empty set of flags, thus never changing their states.
 *
 * The new accumulated state is set on `scope.flags` if that is defined. Otherwise it is set on
 * `scope.model`.
 *
 * @param {String|String[]} possibleFlags
 *    one or a list of flags to watch
 * @param {Object|Function} [optionalOptions]
 *    options and callbacks to use. If a function is passed, it is used as the `onChange` option.
 * @param {Boolean} optionalOptions.initialState
 *    the optional initial state of the accumulated state. If not given each non-inverted flag is initially
 *    assumed to be `false` and `true`, if it is inverted
 * @param {Function|Function[]} optionalOptions.onChange
 *    a function or a list of functions to call whenever the accumuated state of the flags changes. It
 *    receives the new state as first argument and its previous state as second argument
 * @param {String} optionalOptions.scopeKey
 *    the key to set the current accumulated state on in the scope. If not given, nothing happens. For
 *    example `flags.myFlag` would set `scope.flags.myFlag` to the currently valid accumulated state
 * @param {String} optionalOptions.predicate
 *    one of these:
 *    - `any`: if any of the flag's sates is `true`, the accumulated state is `true`. This is the default
 *    - `all`: if all of the flag's states are `true`, the accumulated state is `true`
 *
 * @return {FlagHandler}
 *    this instance for chaining
 */
FlagHandler.prototype.registerFlag = function( possibleFlags, optionalOptions ) {

   const options = {
      predicate: 'any',
      ...( typeof optionalOptions === 'function' ? { onChange: optionalOptions } : optionalOptions )
   };

   const scope = this.scope;
   const applyToScope = 'scopeKey' in options ?
      state => { object.setPath( scope, options.scopeKey, state ); } :
      () => {};

   const flags = processFlags( possibleFlags );
   const changeHandler = processChangeHandlers( options.onChange );
   let oldState = ( typeof options.initialState === 'boolean' ) ?
      options.initialState : evaluateState( flags, options.predicate );

   applyToScope( oldState );

   flags.forEach( flag => {
      this.scope.eventBus.subscribe( `didChangeFlag.${flag.name}`, event => {
         flag.state = flag.negated ? !event.state : event.state;

         const newState = evaluateState( flags, options.predicate );
         if( newState !== oldState ) {
            applyToScope( newState );
            changeHandler( newState, oldState );
            oldState = newState;
         }
      } );
   } );

   return this;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function processFlags( flags ) {
   if( !flags ) {
      return [];
   }

   const flagArr = Array.isArray( flags ) ? flags : [ flags ];
   return flagArr.map( flagExpression => {
      const negated = flagExpression.indexOf( '!' ) === 0;
      return {
         name: negated ? flagExpression.substr( 1 ) : flagExpression,
         negated,
         state: negated // always the state after applying a possible negation
      };
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function processChangeHandlers( handlers ) {
   if( !handlers ) {
      return function() {};
   }

   const handlerArr = Array.isArray( handlers ) ? handlers : [ handlers ];
   return function( newValue, oldValue ) {
      handlerArr.forEach( handler => {
         handler( newValue, oldValue );
      } );
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

const evaluators = {
   any: ( previousValue, flag ) => previousValue === null ? flag.state : flag.state || previousValue,
   all: ( previousValue, flag ) => previousValue === null ? flag.state : flag.state && previousValue
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function evaluateState( flags, predicate ) {
   const state = flags.reduce( evaluators[ predicate ], null );
   return state === null ? false : state;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export {
   handlerFor
};
