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

import { assert, object } from 'laxar';

/**
 * Constant for the value `"any"`. If this is used as argument to `registerFlag` or `registerFlagFromFeature`,
 * any flag state being `true` during evaluation, yields to an overall outcome of `true`
 *
 * @type {String}
 * @name PREDICATE_ANY
 */
export const PREDICATE_ANY = 'any';

/**
 * Constant for the value `"all"`. If this is used as argument to `registerFlag` or `registerFlagFromFeature`,
 * any flag state being `false` during evaluation, yields to an overall outcome of `false`.
 *
 * @type {String}
 * @name PREDICATE_ALL
 */
export const PREDICATE_ALL = 'all';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a publisher for the state of a flag, where the name of the flag is configured as widget feature.
 *
 * @param {AxContext} context
 *    the widget context to work on
 * @param {String} featurePath
 *    the attribute path to the configured flag within the feature map
 * @param {Object} [optionalOptions]
 *    options for the publisher
 * @param {Boolean} [optionalOptions.optional]
 *    if `true`, a missing feature configuration will result in a noop publisher. Else, a missing feature
 *    configuration results in a thrown error. Default is `false`
 *
 * @return {Function}
 *    the state publisher function, expecting only the new state of the flag as `boolean` value
 */
export function publisherForFeature( context, featurePath, optionalOptions ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );

   const options = {
      optional: false,
      ...optionalOptions
   };
   const flagName = object.path( context.features, featurePath );
   if( !flagName ) {
      if( options.optional ) {
         return () => Promise.resolve();
      }
      assert.codeIsUnreachable( `No configuration found for non-optional flag at feature ${featurePath}.` );
   }

   return publisher( context, flagName );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a publisher for the state of a flag, whose name is directly provided as argument.
 *
 * @param {AxContext} context
 *    the widget context to work on
 * @param {String} flagName
 *    the name of the flag
 *
 * @return {Function}
 *    the state publisher function, expecting only the new state of the flag as `boolean` value
 */
export function publisher( context, flagName ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );
   assert( flagName ).hasType( String ).isNotNull();

   return state => {
      return context.eventBus.publish( `didChangeFlag.${flagName}.${!!state}`, {
         flag: flagName,
         state: !!state
      } );
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a new handler instance for *didChangeFlag* events, on which one can attach a listener for
 * accumulated flag changes. Assume for example a feature like `disableOn`, which defines a set of flags,
 * where a `true` state of any of the flags disables the widget. The developer shouldn't care about single
 * flag states but should only be notified, if a change of one flag leads to a change of the accumulated
 * "any flag should be true" state.
 *
 * Additionally it is possible to let the handler set the current state of the accumulated flag on a given
 * context property.
 *
 * @param {AxContext} context
 *    the widget context to work on
 *
 * @return {FlagHandler}
 *    a flag handler instance
 */
export function handlerFor( context ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );

   return new FlagHandler( context );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/**
 * @constructor
 * @private
 */
function FlagHandler( context ) {
   this.context = context;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Registers a flag or a set of flags from the given feature. In contrast to e.g. a `ResourceHandler`, here
 * the complete attribute path to the flag(s) must be provided. This is due to the fact that there is no
 * convention on names for flags on a feature, as there can coexist multiple flags for one feature, each
 * influencing a different aspect of this feature.
 *
 * @param {String} featurePath
 *    the attribute path to the configured flag(s) within the feature map
 * @param {Object|Function} [optionalOptions]
 *    options and callbacks to use. If a function is passed, it is used as the `onChange` option.
 * @param {Boolean} [optionalOptions.initialState]
 *    the optional initial state of the accumulated state. If not given, each non-inverted flag is initially
 *    assumed to be `false`, and `true`, if it is inverted
 * @param {Function|Function[]} [optionalOptions.onChange]
 *    a function or a list of functions to call whenever the accumulated state of the flags changes. It
 *    receives the new state as first argument and its previous state as second argument
 * @param {String} [optionalOptions.contextKey]
 *    the key to set the current accumulated state on in the context. If not given, nothing happens. For
 *    example `flags.myFlag` would set `context.flags.myFlag` to the currently valid accumulated state
 * @param {String} [optionalOptions.predicate]
 *    either {@link #PREDICATE_ANY} (default) or {@link #PREDICATE_ALL}
 *
 * @return {FlagHandler}
 *    this instance for chaining
 */
FlagHandler.prototype.registerFlagFromFeature = function( featurePath, optionalOptions ) {
   return this.registerFlag( object.path( this.context.features, featurePath, [] ), optionalOptions );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Registers a flag or a set of flags given as argument. Even `undefined`, `null` or an empty array
 * are handled gracefully and treated as an empty set of flags, thus never changing their states.
 *
 * The new accumulated state is set on `context.flags` if that is defined. Otherwise it is set on
 * `context.model`.
 *
 * @param {String|String[]} possibleFlags
 *    one or a list of flags to watch
 * @param {Object|Function} [optionalOptions]
 *    options and callbacks to use. If a function is passed, it is used as the `onChange` option.
 * @param {Boolean} [optionalOptions.initialState]
 *    the optional initial state of the accumulated state. If not given each non-inverted flag is initially
 *    assumed to be `false` and `true`, if it is inverted
 * @param {Function|Function[]} [optionalOptions.onChange]
 *    a function or a list of functions to call whenever the accumuated state of the flags changes. It
 *    receives the new state as first argument and its previous state as second argument
 * @param {String} [optionalOptions.contextKey]
 *    the key to set the current accumulated state on in the context. If not given, nothing happens. For
 *    example `flags.myFlag` would set `context.flags.myFlag` to the currently valid accumulated state
 * @param {String} [optionalOptions.predicate]
 *    either {@link #PREDICATE_ANY} (default) or {@link #PREDICATE_ALL}
 *
 * @return {FlagHandler}
 *    this instance for chaining
 */
FlagHandler.prototype.registerFlag = function( possibleFlags, optionalOptions ) {

   const options = {
      predicate: PREDICATE_ANY,
      ...( typeof optionalOptions === 'function' ? { onChange: optionalOptions } : optionalOptions )
   };

   const applyToContext = 'contextKey' in options ?
      state => { object.setPath( this.context, options.contextKey, state ); } :
      () => {};

   const flags = processFlags( possibleFlags );
   const changeHandler = processChangeHandlers( options.onChange );
   let oldState = ( typeof options.initialState === 'boolean' ) ?
      options.initialState : evaluateState( flags, options.predicate );

   applyToContext( oldState );

   flags.forEach( flag => {
      this.context.eventBus.subscribe( `didChangeFlag.${flag.name}`, event => {
         flag.state = flag.negated ? !event.state : event.state;

         const newState = evaluateState( flags, options.predicate );
         if( newState !== oldState ) {
            applyToContext( newState );
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
      return () => {};
   }

   const handlerArr = Array.isArray( handlers ) ? handlers : [ handlers ];
   return ( newValue, oldValue ) => {
      handlerArr.forEach( handler => {
         handler( newValue, oldValue );
      } );
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

const evaluators = {
   [ PREDICATE_ANY ]: ( previousValue, { state } ) => previousValue === null ? state : state || previousValue,
   [ PREDICATE_ALL ]: ( previousValue, { state } ) => previousValue === null ? state : state && previousValue
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function evaluateState( flags, predicate ) {
   const state = flags.reduce( evaluators[ predicate ], null );
   return state === null ? false : state;
}
