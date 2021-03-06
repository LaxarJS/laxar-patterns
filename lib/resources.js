/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
/**
 * This module provides helpers for patterns regarding *didReplace* and *didUpdate* events.
 *
 * @module resources
 */
import jsonPatch from 'fast-json-patch';
import { assert, object } from 'laxar';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and returns a function to publish *didReplace* events for the resource found as feature
 * configuration. Resolution of the `featurePath` argument works just as explained in the documentation for
 * {@link #ResourceHandler.registerResourceFromFeature}. The publisher returns the promise returned by
 * the underlying event bus call.
 *
 * By default a handler for `replaceRequest` events of the underlying resource is added. This handler
 * caches the most recently published version of a resource and publishes it again, if a `replaceRequest`
 * event for this resource is received. Note that eny changes imposed on the resource via `didUpdate` events
 * are ignored and won't be reflected on the cached resource.
 *
 * @param {AxContext} context
 *    the widget context to work on
 * @param {String} featurePath
 *    the property of `context.features` the publisher reads the resource name from
 * @param {Object} [optionalOptions]
 *    options for the publisher
 * @param {Boolean} [optionalOptions.deliverToSender]
 *    the value is forwarded to `eventBus.publish`: if `true` the event will also be delivered to the
 *    publisher. Default is `false`
 * @param {Boolean} [optionalOptions.isOptional]
 *    if `true`, a missing `featurePath.resource` is ignored and the returned publisher won't do anything
 *    when called. Default is `false`.
 * @param {Function|Boolean} [optionalOptions.replaceRequestHandler]
 *    if `false`, replace request support is disabled. if `true`, `replaceRequest` events are automatically
 *    handled by using an internal cache for the last version of the resource. If a function is provided,
 *    internal caching is disabled, and instead the given handler is asked to return a promise for the
 *    resource to publish. Default is `true`.
 *
 * @return {Function}
 *    the publisher function. Takes the data to publish as single argument
 */
export function replacePublisherForFeature( context, featurePath, optionalOptions ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );
   assert( context.eventBus ).hasType( Object ).isNotNull();

   const options = {
      deliverToSender: false,
      replaceRequestHandler: true,
      ...optionalOptions
   };

   const resource = object.path( context.features, `${featurePath}.resource` );
   if( !resource && options.isOptional ) {
      return () => Promise.resolve();
   }

   if( !resource || typeof resource !== 'string' ) {
      missingConfig( 'replacePublisherForFeature', context, featurePath );
   }

   let resourceCache = null;
   let replaceRequestHandler = null;
   if( options.replaceRequestHandler === true ) {
      replaceRequestHandler =
         () => Promise.resolve( resourceCache != null ? JSON.parse( resourceCache ) : null );
   }
   else if( typeof options.replaceRequestHandler === 'function' ) {
      replaceRequestHandler = options.replaceRequestHandler;
   }
   if( replaceRequestHandler ) {
      context.eventBus.subscribe( 'replaceRequest', ( event, ...args ) => {
         if( !event.resource || event.resource === resource ) {
            context.eventBus.publish(
               `willReplace.${resource}`,
               { resource },
               { deliverToSender: !!options.deliverToSender }
            );
            replaceRequestHandler( event, ...args )
               .then( publishDidReplace );
         }
      } );
   }

   return data => {
      if( options.replaceRequestHandler === true ) {
         resourceCache = JSON.stringify( data );
      }
      return publishDidReplace( data );
   };

   function publishDidReplace( data ) {
      return context.eventBus.publish(
         `didReplace.${resource}`,
         { resource, data },
         { deliverToSender: !!options.deliverToSender }
      );
   }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates and returns a function to publish *didUpdate* events for the resource found as feature
 * configuration. Resolution of the `featurePath` argument works just as explained in the documentation for
 * {@link #ResourceHandler.registerResourceFromFeature}. The publisher returns the promise returned by
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
 * result in a very large number of *replace* operations that shift the properties from successors to the
 * front in order to overwrite instead of remove the entry.
 * In such cases one is better off by manually creating a patch with operation *remove*, as the knowledge
 * about the domain is available at the user of this publisher.
 *
 * @deprecated
 *    In practice updates as a resource pattern turned out to be rather error prone and difficult to manage
 *    correctly. In our experience sending the complete resource via `didReplace` on change again is much
 *    simpler and removes potential overhead while calculating the patches. You may still use `didUpdate`
 *    events in your application, but pattern support will be dropped without replacement, probably in the
 *    next major release.
 *
 * @param {AxContext} context
 *    the widget context to work on
 * @param {String} featurePath
 *    the property of `context.features` the publisher reads the resource name from
 * @param {Object} [optionalOptions]
 *    options for the publisher
 * @param {Boolean} [optionalOptions.deliverToSender]
 *    the value is forward to `eventBus.publish`: if `true` the event will also be delivered to the
 *    publisher. Default is `false`
 * @param {Boolean} [optionalOptions.isOptional]
 *    if `true`, a missing `featurePath.resource` is ignored and the returned publisher won't do anything
 *    when called. Default is `false`.
 *
 * @return {Function}
 *    the publisher function as described above
 */
export function updatePublisherForFeature( context, featurePath, optionalOptions ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );
   assert( context.eventBus ).hasType( Object ).isNotNull();

   const options = { deliverToSender: false, ...optionalOptions };

   const resource = object.path( context.features, `${featurePath}.resource` );
   if( !resource && options.isOptional ) {
      const noopPublisher = () => Promise.resolve();
      noopPublisher.compareAndPublish = noopPublisher;
      return noopPublisher;
   }

   if( !resource || typeof resource !== 'string' ) {
      missingConfig( 'updatePublisherForFeature', context, featurePath );
   }

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
 * Creates a new handler instance for *didReplace* and *didUpdate* events. It already handles setting of the
 * resource data on *didReplace* in the `context.resources` property and updating that data on *didUpdate*
 * events.
 *
 * @param {AxContext} context
 *    the widget context to work on
 *
 * @return {ResourceHandler}
 *    a resource handler instance
 */
export function handlerFor( context ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );

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
 * register the handler for. All replacements and updates will be written to `context.resources` according to
 * the rules found at the `optionalOptions.modelKey` doc.
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
 * The corresponding call would be (providing none of the options):
 *
 * ```js
 * resources.handlerFor( context )
 *    .registerResourceFromFeature( 'someFeature.someResourceConfig' );
 * ```
 *
 * @param {String} featurePath
 *    the attribute path to the feature for the resource
 * @param {Object|Function} [optionalOptions]
 *    options and callbacks to use. If a function is passed, it is used as the `onUpdateReplace` option.
 * @param {Function|Function[]} [optionalOptions.onReplace]
 *    a function or a list of functions to call when a didReplace event is received. Each function
 *    receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called
 *    first the second time a didReplace event occurs
 * @param {Function|Function[]} [optionalOptions.onUpdate]
 *    a function or a list of functions to call when a didUpdate event is received. Each function
 *    receives the event object as argument
 * @param {Function|Function[]} [optionalOptions.onUpdateReplace]
 *    a function or a list of functions to call when a didUpdate or a didReplace event is received. Each
 *    function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is
 *    not called for the first received didReplace event
 * @param {Boolean} [optionalOptions.omitFirstReplace]
 *    if `true` `options.onReplace` is only called after the first time a didReplace event occurred. Default
 *    is `false`
 * @param {String} [optionalOptions.modelKey]
 *    the key to use for the resource in `context.resources`. If not given the last path fragment of
 *    `featurePath` is used. For example if the path is `myFeature.superResource` the key will be
 *    `superResource`
 * @param {Boolean} [optionalOptions.isOptional]
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
   if( resource === null ) {
      if( options.isOptional ) {
         return this;
      }
      missingConfig( 'registerResourceFromFeature', this.context_, featurePath );
   }

   if( !options.modelKey ) {
      options.modelKey = featurePath.substr( featurePath.lastIndexOf( '.' ) + 1 );
   }

   return this.registerResource( resource, options );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Registers default event handlers for a known resource name.All replacements and updates will be written to
 * `context.resources` according to the rules found at the `optionalOptions.modelKey` doc.
 *
 * @param {String} resource
 *    the resource the handler should be registered for
 * @param {Object|Function} [optionalOptions]
 *    options and callbacks to use. If a function is passed, it is used as the `onUpdateReplace` option.
 * @param {Function|Function[]} [optionalOptions.onReplace]
 *    a function or a list of functions to call when a didReplace event is received. Each function
 *    receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called
 *    first the second time a didReplace event occurs
 * @param {Function|Function[]} [optionalOptions.onUpdate]
 *    a function or a list of functions to call when a didUpdate event is received. Each function
 *    receives the event object as argument
 * @param {Function|Function[]} [optionalOptions.onUpdateReplace]
 *    a function or a list of functions to call when a didUpdate or a didReplace event is received. Each
 *    function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is
 *    only called first for didReplace events the second time such an event occurs
 * @param {Boolean} [optionalOptions.omitFirstReplace]
 *    if `true` `options.onReplace` is only called after the first time a didReplace event occurred.
 *    Default is `false`
 * @param {String} [optionalOptions.modelKey]
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
 * Registers a callback that is called once all registered resources were initially replaced. If more resource
 * handlers are registered before all relevant didReplace events were received, those are also waited
 * for.
 *
 * @param {Function} callback
 *     the function to call
 * @param {Boolean} [optionalOptions]
 *    an optional set of parameters to specify watch behavior
 * @param {Boolean} [optionalOptions.watch]
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

function replaceHandler( context, modelKey ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );
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

function updateHandler( context, modelKey ) {
   assert( context ).hasType( Object ).hasProperty( 'eventBus' );
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

function provideResourceBucket( context ) {
   if( !context.hasOwnProperty( 'resources' ) || typeof context.resources !== 'object' ) {
      context.resources = {};
   }

   return context.resources;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function missingConfig( apiName, context, featurePath ) {
   const msg = `${apiName}: missing configuration for "features.${featurePath}.resource"`;
   context.log.error( msg );
   assert.codeIsUnreachable( msg );
}
