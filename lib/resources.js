/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *didReplace* and *didUpdate* events.
 *
 * Definition of the `context` object mentioned throughout this api:
 *
 * In the simplest case this can be the AngularJS `$scope` passed into a widget. Technically this can be
 * any object exposing these three properties:
 * - `eventBus`: The event bus instance used for event subscriptions and publishing events
 * - `features`: The configuration of the widget, used for automagical resource handling
 * - `resources`: An object where all registered resources and updates to them are written to. Will be
 *   added if it doesn't exist.
 *
 * @module resources
 */
import jsonPatch from 'fast-json-patch';
import { assert, object } from 'laxar';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and returns a simple handler function for didReplace events. Replaces will be written to
 * `context.resources` under the given value for `modelKey`.
 *
 * @param {Object} context
 *    the context the handler works on
 * @param {String} modelKey
 *    the property of `context,resources` the handler writes replaces to
 *
 * @return {Function}
 *    the handler function
 */
function replaceHandler( context, modelKey ) {
   assert( context ).hasType( Object ).isNotNull();
   assert( modelKey ).hasType( String ).isNotNull();

   const resourceBucket = provideResourceBucket( context );
   return event => {
      if( resourceBucket[ modelKey ] == null && event.data == null ) {
         return false;
      }

      resourceBucket[ modelKey ] = event.data;
      return true;
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and returns a simple handler function for didUpdate events. Updates will be written to
 * `context.resources` under the given value for `modelKey`.
 *
 * @param {Object} context
 *    the context the handler works on
 * @param {String} modelKey
 *    the property of `context.resources` the handler applies updates to
 *
 * @return {Function}
 *    the handler function
 */
function updateHandler( context, modelKey ) {
   assert( context ).hasType( Object ).isNotNull();
   assert( modelKey ).hasType( String ).isNotNull();

   const resourceBucket = provideResourceBucket( context );
   return event => {
      if( resourceBucket[ modelKey ] != null && Array.isArray( event.patches ) ) {
         jsonPatch.apply( resourceBucket[ modelKey ], event.patches );
         return true;
      }

      return false;
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and returns a function to publish didReplace events for the resource found as feature
 * configuration. Resolution of the `featurePath` argument works just as explained in the documentation for
 * {@link ResourceHandler#registerResourceFromFeature}. The publisher returns the promise returned by
 * the underlying event bus call.
 *
 * @param {Object} context
 *    the context the publisher works on
 * @param {String} featurePath
 *    the property of `context.features` the publisher reads the resource name from
 * @param {Object} [optionalOptions]
 *    options for the publisher
 * @param {Boolean} optionalOptions.deliverToSender
 *    the value is forwarded to `eventBus.publish`: if `true` the event will also be delivered to the
 *    publisher. Default is `false`
 * @param {Boolean} optionalOptions.isOptional
 *    if `true`, don't throw an error if `featurePath.resource` is missing. Instead return a publisher
 *    that doesn't do anything when called. Default is `false`.
 *
 * @return {Function}
 *    the publisher function. Takes the data to publish as single argument
 */
function replacePublisherForFeature( context, featurePath, optionalOptions ) {
   assert( context ).hasType( Object ).isNotNull();
   assert( context.eventBus ).hasType( Object ).isNotNull();

   const options = { deliverToSender: false, ...optionalOptions };

   const resourceName = object.path( context.features, `${featurePath}.resource` );
   if( !resourceName && options.isOptional ) {
      return () => Promise.resolve();
   }
   assert( resourceName ).hasType( String ).isNotNull();

   return replacement => {
      return context.eventBus.publish( `didReplace.${resourceName}`, {
         resource: resourceName,
         data: replacement
      }, {
         deliverToSender: !!options.deliverToSender
      } );
   };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and returns a function to publish didUpdate events for the resource found as feature
 * configuration. Resolution of the `featurePath` argument works just as explained in the documentation for
 * {@link ResourceHandler#registerResourceFromFeature}. The publisher returns the promise returned by
 * the underlying event bus call. The returned function only accepts one argument, which is the JSON patch
 * sequence conforming to [RFC 6902](https://tools.ietf.org/html/rfc6902).
 *
 * Example:
 * ```js
 * const publisher = resources.updatePublisherForFeature( context, path );
 * publisher( [
 *    { op: 'remove', path: '/accounts/2' },
 *    { op: 'replace', path: '/contacts/hans/number', value: '+49 123 4563432' }
 * ] );
 * ```
 *
 * Additionally the returned function has a method `compareAndPublish` that accepts the previous version of
 * a resource as first argument and the current version of the resource as second argument. It then creates
 * the JSON patch sequence itself and sends the according didUpdate event. It also returns the promise
 * returned by the underlying event bus call.
 *
 * Example:
 * ```js
 * const publisher = resources.updatePublisherForFeature( context, path );
 * publisher.compareAndPublish( obsoleteVersion, currentVersion );
 * ```
 *
 * Note that a generic generation of patches might lead to strange, large patch sequences, especially when
 * removing entries. The diff library doesn't know about identities and as such won't recognize where a
 * specific element was removed. As a consequence instead of generating a remove operation, this could
 * result in a very large number of replace operations that shift the properties from successors to the
 * front in order to overwrite instead of remove the entry.
 * In such cases one is better off by manually creating a patch with operation remove, as the knowledge
 * about the domain is available at the user of this publisher.
 *
 * @param {Object} context
 *    the context the publisher works on
 * @param {String} featurePath
 *    the property of `context.features` the publisher reads the resource name from
 * @param {Object} [optionalOptions]
 *    options for the publisher
 * @param {Boolean} optionalOptions.deliverToSender
 *    the value is forward to `eventBus.publish`: if `true` the event will also be delivered to the
 *    publisher. Default is `false`
 * @param {Boolean} optionalOptions.isOptional
 *    if `true`, don't throw an error if `featurePath.resource` is missing. Instead return a publisher
 *    that doesn't do anything when called. Default is `false`.
 *
 * @return {Function}
 *    the publisher function as described above
 */
function updatePublisherForFeature( context, featurePath, optionalOptions ) {
   assert( context ).hasType( Object ).isNotNull();
   assert( context.eventBus ).hasType( Object ).isNotNull();

   const options = { deliverToSender: false, ...optionalOptions };

   const resource = object.path( context.features, `${featurePath}.resource` );
   if( !resource && options.isOptional ) {
      const noopPublisher = () => Promise.resolve();
      noopPublisher.compareAndPublish = noopPublisher;
      return noopPublisher;
   }
   assert( resource ).hasType( String ).isNotNull();

   const publisher = patches => {
      assert( patches ).hasType( Array ).isNotNull();

      if( !patches || !patches.length ) {
         context.log.trace(
            'updatePublisher: Not sending empty didUpdate to resource "[0]" from sender "[1]".',
            resource, ( context.widget || { id: 'unknown' } ).id
         );
         return Promise.resolve();
      }

      const meta = { deliverToSender: !!options.deliverToSender };
      return context.eventBus.publish( `didUpdate.${resource}`, { resource, patches }, meta );
   };

   publisher.compareAndPublish = ( from, to ) => publisher( jsonPatch.compare( from, to ) );

   return publisher;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a new handler instance for didReplace and didUpdate events. It already handles setting of the
 * resource data on didReplace in the context.resources property and updating that data on didUpdate events.
 *
 * @param {Object} context
 *    the context the handler should work with. It expects to find an `eventBus` property there with which
 *    it can do the event handling
 *
 * @return {ResourceHandler}
 *    a resource handler instance
 */
function handlerFor( context ) {
   return new ResourceHandler( context );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/** @private */
function ResourceHandler( context ) {
   this.context_ = context;
   this.externalHandlers_ = {};
   this.modelHandlers_ = {};
   this.waitingFor_ = [];
   this.allReplacedCallback_ = () => {};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Registers default event handlers for a feature. The `feature` argument is interpreted as attribute
 * path to an object having a `resource` property of type string holding the name of the resource to
 * register the handler for. All replacements and updates will be written to `context.resources` by the
 * rules written at `options.modelKey` doc.
 *
 * Example:
 * Consider the following configuration:
 * ```json
 * {
 *    "features": {
 *       "someFeature": {
 *          "someResourceConfig": {
 *             "resource": "myResource"
 *          }
 *       }
 *    }
 * }
 * ```
 *
 * The corresponding call, using an AngularJS Scope as context, would be (providing none of the options):
 *
 * ```js
 * patterns.resources.handlerFor( $scope )
 *    .registerResourceFromFeature( 'someFeature.someResourceConfig' );
 * ```
 *
 * @param {String} featurePath
 *    the attribute path to the feature for the resource
 * @param {Object|Function} [optionalOptions]
 *    options and callbacks to use. If a function is passed, it is used as the `onUpdateReplace` option.
 * @param {Function|Function[]} optionalOptions.onReplace
 *    a function or a list of functions to call when a didReplace event is received. Each function
 *    receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called
 *    first the second time a didReplace event occurs
 * @param {Function|Function[]} optionalOptions.onUpdate
 *    a function or a list of functions to call when a didUpdate event is received. Each function
 *    receives the event object as argument
 * @param {Function|Function[]} optionalOptions.onUpdateReplace
 *    a function or a list of functions to call when a didUpdate or a didReplace event is received. Each
 *    function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is
 *    not called for the first received didReplace event
 * @param {Boolean} optionalOptions.omitFirstReplace
 *    if `true` `options.onReplace` is only called after the
 *    first time a didReplace event occurred. Default is `false`
 * @param {String} optionalOptions.modelKey
 *    the key to use for the resource in `context.resources`. If not given the last path fragment of
 *    `featurePath` is used. For example if the path is `myfeature.superResource` the key will be
 *    `superResource`
 * @param {Boolean} optionalOptions.isOptional
 *    if set to `true`, missing configuration for this resource is silently ignored and no handlers
 *    are registered. If set to `false`, an error will be raised in this case (default is `false`)
 *
 * @return {ResourceHandler}
 *    this instance for chaining
 */
ResourceHandler.prototype.registerResourceFromFeature = function( featurePath, optionalOptions ) {
   const resource = object.path( this.context_.features, `${featurePath}.resource`, null );
   const options = {
      isOptional: false,
      ...( typeof optionalOptions === 'function' ? { onUpdateReplace: optionalOptions } : optionalOptions )
   };
   if( resource === null && options.isOptional ) {
      return this;
   }
   assert( resource ).isNotNull( `Could not find resource configuration in features for "${featurePath}"` );

   if( !options.modelKey ) {
      options.modelKey = featurePath.substr( featurePath.lastIndexOf( '.' ) + 1 );
   }

   return this.registerResource( resource, options );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Registers default event handlers for a known resource name. All replacements and updates will be
 * written to `context.resources`.
 *
 * @param {String} resource
 *    the resource the handler should be registered for
 * @param {Object|Function} [optionalOptions]
 *    options and callbacks to use. If a function is passed, it is used as the `onUpdateReplace` option.
 * @param {Function|Function[]} optionalOptions.onReplace
 *    a function or a list of functions to call when a didReplace event is received. Each function
 *    receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called
 *    first the second time a didReplace event occurs
 * @param {Function|Function[]} optionalOptions.onUpdate
 *    a function or a list of functions to call when a didUpdate event is received. Each function
 *    receives the event object as argument
 * @param {Function|Function[]} optionalOptions.onUpdateReplace
 *    a function or a list of functions to call when a didUpdate or a didReplace event is received. Each
 *    function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is
 *    only called first for didReplace events the second time such an event occurs
 * @param {Boolean} optionalOptions.omitFirstReplace
 *    if `true` `options.onReplace` is only called after the first time a didReplace event occurred.
 *    Default is `false`
 * @param {String} optionalOptions.modelKey
 *    the key to use for the resource in `context.resources`. If not given the value of `resource` is
 *    used
 *
 * @return {ResourceHandler}
 *    this instance for chaining
 */
ResourceHandler.prototype.registerResource = function( resource, optionalOptions ) {
   assert( resource ).hasType( String ).isNotNull();

   const options = {
      omitFirstReplace: false,
      modelKey: resource,
      ...( typeof optionalOptions === 'function' ? { onUpdateReplace: optionalOptions } : optionalOptions )
   };

   this.waitingFor_.push( resource );
   registerResourceHandlers( this, resource, options );

   if( !( resource in this.modelHandlers_ ) ) {
      this.modelHandlers_[ resource ] = {};
   }

   registerForReplace( this, resource, options );
   registerForUpdate( this, resource, options );

   return this;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Registers a callback that is called once all resources were initially replaced. If more resource
 * handlers are registered before all relevant didReplace events were received, those are also waited
 * for.
 *
 * @param {Function} callback
 *     the function to call
 * @param {Boolean} [optionalOptions]
 *    an optional set of parameters to specify watch behavior
 * @param {Boolean} optionalOptions.watch
 *    if `true`, the callback will be called again whenever resources are modified after all were
 *    replaced at least once
 *
 * @return {ResourceHandler}
 *    this instance for chaining
 */
ResourceHandler.prototype.whenAllWereReplaced = function( callback, optionalOptions ) {
   assert( callback ).hasType( Function ).isNotNull();

   this.allReplacedCallback_ = optionalOptions && optionalOptions.watch ? callback : onceCallback;

   return this;

   function onceCallback() {
      callback();
      this.allReplacedCallback_ = () => {};
   }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Allows to find out if there are still outstanding resources, or if all resources have been replaced.
 * Can be used in update-/replace-handlers to determine if all dependencies are satisfied.
 *
 * @return {Boolean}
 *    `true` if all resources registered with this handler (so far) have been replaced at least once,
 *    `false` if there are still outstanding resources
 */
ResourceHandler.prototype.wereAllReplaced = function() {
   return !this.waitingFor_.length;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/** @private */
function registerResourceHandlers( self, resource, options ) {
   if( !self.externalHandlers_[ resource ] ) {
      self.externalHandlers_[ resource ] = {
         onReplace: [],
         onUpdate: []
      };
   }

   appendFunctionOrArrayOfFunctions( self.externalHandlers_[ resource ].onUpdate, options.onUpdate );
   appendFunctionOrArrayOfFunctions( self.externalHandlers_[ resource ].onUpdate, options.onUpdateReplace );

   let replaceHandlers = [];
   appendFunctionOrArrayOfFunctions( replaceHandlers, options.onReplace );
   appendFunctionOrArrayOfFunctions( replaceHandlers, options.onUpdateReplace );

   if( options.omitFirstReplace ) {
      replaceHandlers = replaceHandlers.map( handler => ignoringFirstCall( handler ) );
   }

   function ignoringFirstCall( f ) {
      let ignore = true;
      return ( ...args ) => {
         if( ignore ) {
            ignore = false;
            return;
         }
         f.apply( self, args );
      };
   }

   appendFunctionOrArrayOfFunctions( self.externalHandlers_[ resource ].onReplace, replaceHandlers );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/** @private */
function registerForReplace( self, resource, options ) {
   const handler = replaceHandler( self.context_, options.modelKey );
   if( self.modelHandlers_[ resource ].onReplace ) {
      self.modelHandlers_[ resource ].onReplace.push( handler );
      return;
   }
   self.modelHandlers_[ resource ].onReplace = [ handler ];

   self.context_.eventBus.subscribe( `didReplace.${resource}`, ( event, meta ) => {
      const changed = self.modelHandlers_[ resource ].onReplace
         .reduce( ( changed, handler ) => handler( event, meta ) || changed, false );

      if( !changed ) { return; }

      try {
         self.externalHandlers_[ resource ].onReplace.forEach( handler => handler( event, meta ) );
      }
      finally {
         self.waitingFor_ = self.waitingFor_.filter( topic => topic !== resource );
         if( !self.waitingFor_.length ) {
            self.allReplacedCallback_();
         }
      }

   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/** @private */
function registerForUpdate( self, resource, options ) {
   const handler = updateHandler( self.context_, options.modelKey );
   if( self.modelHandlers_[ resource ].onUpdate ) {
      self.modelHandlers_[ resource ].onUpdate.push( handler );
      return;
   }
   self.modelHandlers_[ resource ].onUpdate = [ handler ];

   self.context_.eventBus.subscribe( `didUpdate.${resource}`, ( event, meta ) => {
      const changed = self.modelHandlers_[ resource ].onUpdate
         .reduce( ( changed, handler ) => handler( event, meta ) || changed, false );

      if( !changed ) { return; }

      try {
         self.externalHandlers_[ resource ].onUpdate.forEach( handler => handler( event, meta ) );
      }
      finally {
         if( !self.waitingFor_.length ) {
            self.allReplacedCallback_();
         }
      }
   } );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/** @private */
function appendFunctionOrArrayOfFunctions( target, funcOrArray ) {
   if( typeof funcOrArray === 'function' ) {
      target.push( funcOrArray );
      return;
   }

   if( Array.isArray( funcOrArray ) ) {
      Array.prototype.push.apply( target, funcOrArray );
   }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// eslint-disable-next-line valid-jsdoc
/** @private */
function provideResourceBucket( context ) {
   if( !context.hasOwnProperty( 'resources' ) || typeof context.resources !== 'object' ) {
      context.resources = {};
   }

   return context.resources;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Tests if two objects represent the same resource.
 *
 * The test takes place as follows:
 *  - Let value of `counter` be zero.
 *  - For each attribute (or attribute path) in `attribute` test the following:
 *    - If both objects contain the attribute (or a defined value at the given path), check for
 *       identity using `===`.
 *       - If this check is negative, skip further testing and let the result of the function be `false`.
 *       - If it is positive, increment `counter`.
 *    - If none of the objects contains the attribute (or a defined value at the given path), skip to
 *       the next attribute.
 *    - If the attribute (or a defined value at the given path) exist only in one of the objects, skip
 *       further testing and let the result of the function be `false`.
 *  - If all attributes have been tested and the value of `counter` is greater than zero, let the result
 *    of the function be `true`, `false` otherwise.
 *
 * @param {Object} resourceA
 *    the first object to test
 * @param {Object} resourceB
 *    the second object to test
 * @param {String[]} compareAttributes
 *    the list of attributes determining resource identity
 *
 * @return {Boolean}
 *    `true` if both objects are assumed to represent the same resource, `false` otherwise
 */
function isSame( resourceA, resourceB, compareAttributes ) {
   if( resourceA == null || resourceB == null ) {
      return false;
   }

   let matches = 0;
   for( let i = 0; i < compareAttributes.length; ++i ) {
      const key = compareAttributes[ i ];
      if( key.indexOf( '.' ) !== -1 ) {
         // Compare using object.path (only if needed, for performance):
         const valueA = object.path( resourceA, key );
         const valueB = object.path( resourceB, key );
         if( valueA === undefined && valueB === undefined ) {
            continue;
         }
         if( valueA === valueB ) {
            ++matches;
         }
         else {
            return false;
         }
      }
      else {
         if( !( key in resourceA ) && !( key in resourceB ) ) {
            continue;
         }
         if( resourceA[ key ] === resourceB[ key ] ) {
            ++matches;
         }
         else {
            return false;
         }
      }
   }
   return matches > 0;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

export {
   replaceHandler,
   updateHandler,
   replacePublisherForFeature,
   updatePublisherForFeature,
   isSame,
   handlerFor
};
