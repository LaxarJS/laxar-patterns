/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   'laxar',
   'underscore',
   './patches',
   'json-patch'
], function( ax, _, patches, jsonPatch ) {
   'use strict';

   var assert = ax.assert;

   /**
    * Creates and returns a simple handler function for didReplace events. If `scope.resources` is defined and
    * of type `object` this will be used to write replaces to. In any other case `scope.model` will be used.
    *
    * @param {Object} scope
    *    the scope the handler works on
    * @param {String} modelKey
    *    the property of `scope.model` / `scope,resources` the handler writes replaces to
    *
    * @return {Function}
    *    the handler function
    */
   function replaceHandler( scope, modelKey ) {
      assert( scope ).hasType( Object ).isNotNull();
      assert( modelKey ).hasType( String ).isNotNull();

      var resourceBucket = provideResourceBucket( scope, 'resources' );
      return function didReplaceHandler( event ) {
         if( resourceBucket[ modelKey ] == null && event.data == null ) {
            return false;
         }

         resourceBucket[ modelKey ] = event.data;
         return true;
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a simple handler function for didUpdate events. If `scope.resources` is defined and
    * of type `object` this will be used to write updates to. In any other case `scope.model` will be used.
    *
    * @param {Object} scope
    *    the scope the handler works on
    * @param {String} modelKey
    *    the property of `scope.model` / `scope,resources` the handler applies updates to
    *
    * @return {Function}
    *    the handler function
    */
   function updateHandler( scope, modelKey ) {
      assert( scope ).hasType( Object ).isNotNull();
      assert( modelKey ).hasType( String ).isNotNull();

      var resourceBucket = provideResourceBucket( scope, 'resources' );
      return function didUpdateHandler( event ) {
         if( _.isEmpty( event.data ) && _.isEmpty( event.updates ) && resourceBucket[ modelKey ] == null ) {
            return false;
         }

         if( Array.isArray( event.patches ) ) {
            jsonPatch.apply( resourceBucket[ modelKey ], event.patches );
            return true;
         }

         if( 'data' in event ) {
            if( _.isObject( resourceBucket[ modelKey ] ) && _.isObject( event.data ) ) {
               _.extend( resourceBucket[ modelKey ], event.data );
            }
            else {
               resourceBucket[ modelKey ] = event.data;
            }
         }

         if( 'updates' in event ) {
            patches.apply( resourceBucket[ modelKey ], event.updates );
         }

         return true;
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a function to publish didReplace events for the resource found as feature
    * configuration. Resolution of the `featurePath` argument works just as explained in the documentation for
    * `ResourceHandler.prototype.registerResourceFromFeature`.
    *
    * @param {Object} scope
    *    the scope the publisher works on
    * @param {String} featurePath
    *    the property of `scope.model` the publisher reads the resource name from
    *
    * @return {Function}
    *    the publisher function. Takes the data to publish as single argument.
    */
   function replacePublisherForFeature( scope, featurePath ) {
      assert( scope ).hasType( Object ).isNotNull();
      assert( scope.eventBus ).hasType( Object ).isNotNull();

      var resourceName = ax.object.path( scope.features, featurePath + '.resource' );
      assert( resourceName ).hasType( String ).isNotNull();

      return function didReplacePublisher( replacement ) {
         scope.eventBus.publish( 'didReplace.' + resourceName, {
            resource: resourceName,
            data: replacement
         }, {
            deliverToSender: false
         } );
      };
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates and returns a function to publish didUpdate events for the resource found as feature
    * configuration. Resolution of the `featurePath` argument works just as explained in the documentation for
    * `ResourceHandler.prototype.registerResourceFromFeature`.
    *
    * The return value of this function differs according to the capabilities and needs of the api consumer.
    * If the option `jsonPatchOnly` is omitted, the returned function exposes the "compatibility" signature
    * supporting three arguments: `updates`, `data` and `patches`. Each one of them that is not `null` is add
    * as property to the event. This should really only be used for backwards compatibility. For new widgets
    * `jsonPatchOnly` should be set to `true` (which will become the default in the next major release). By
    * doing so the returned function only accepts one argument, which is the JSON patch array.
    *
    * Compatibility example:
    * ```
    * var publisher = resources.updatePublisherForFeature( scope, path );
    * publisher( myUpdates, myData, myPatches );
    * ```
    * JSON patch example:
    * ```
    * var publisher = resources.updatePublisherForFeature( scope, path, { jsonPatchOnly: true } );
    * publisher( myPatches );
    * ```
    *
    * Additionally the returned function has a method `compareAndPublish` that accepts the obsolete version of
    * a resource as first argument and the current version of the resource as second argument. It then creates
    * the JSON patch array itself and sends the according didUpdate event.
    *
    * Example:
    * ```
    * var publisher = resources.updatePublisherForFeature( scope, path, { jsonPatchOnly: true } );
    * publisher.compareAndPublish( obsoleteVersion, currentVersion );
    * ```
    *
    * @param {Object} scope
    *    the scope the publisher works on
    * @param {String} featurePath
    *    the property of `scope.model` the publisher reads the resource name from
    * @param {Object} [optionalOptions]
    *    options for the publisher
    * @param {Boolean} optionalOptions.jsonPatchOnly
    *    if `true` the signature of the publisher changes to only support a json patch array as single
    *    argument. Default is `false`
    *
    * @return {Function}
    *    the publisher function as described above
    */
   function updatePublisherForFeature( scope, featurePath, optionalOptions ) {
      assert( scope ).hasType( Object ).isNotNull();
      assert( scope.eventBus ).hasType( Object ).isNotNull();

      var resourceName = ax.object.path( scope.features, featurePath + '.resource' );
      assert( resourceName ).hasType( String ).isNotNull();

      var options = ax.object.options( optionalOptions, {
         jsonPatchOnly: false
      } );

      var publisher = function( updates, data, patches ) {
         var event = {
            resource: resourceName
         };
         if( updates != null ) {
            event.updates = updates;
         }
         if( data != null ) {
            event.data = data;
         }
         if( patches != null ) {
            event.patches = patches;
         }

         scope.eventBus.publish( 'didUpdate.' + resourceName, event, {
            deliverToSender: false
         } );
      };

      var patchOnlyPublisher = publisher.bind( null, null, null );
      if( options.jsonPatchOnly ) {
         publisher = patchOnlyPublisher;
      }

      publisher.compareAndPublish = function( from, to ) {
         var patches = jsonPatch.compare( from, to );
         patchOnlyPublisher( patches );
      };

      return publisher;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Creates a new handler instance for didReplace and didUpdate events. It already handles setting of the
    * resource data on didReplace in the scope.model property and updating that data on didUpdate events.
    *
    * @param {Object} scope
    *    the scope the handler should work with. It is expected to find an `eventBus`
    *    property there with which it can do the event handling
    *
    * @return {ResourceHandler}
    *    not `null`
    */
   function handlerFor( scope ) {
      return new ResourceHandler( scope );
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   function ResourceHandler( scope ) {
      this.scope_ = scope;
      this.externalHandlers_ = {};
      this.modelHandlers_ = {};
      this.waitingFor_ = [];
      this.allReplacedCallback_ = _.identity;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   ResourceHandler.prototype = {

      /**
       * Registers default event handlers for a feature. The `feature` argument is interpreted as attribute
       * path to an object having a `resource` property of type string holding the name of the resource to
       * register the handler for. All replacements and updates will be written to `scope.resources` if it is
       * defined and of type `object`. In any other case `scope.model` will be used.
       *
       * Example:
       * Consider the following configuration:
       * ```
       *     features: {
       *        someFeature: {
       *           someResourceConfig: {
       *              resource: 'myResource'
       *           }
       *        }
       *     }
       * ```
       * The according call would be (providing none of the options):
       * ```
       *     createResourceHandlerForScope( $scope )
       *         .registerResourceFromFeature( 'someFeature.someResourceConfig' );
       * ```
       *
       * @param {String} featurePath
       *    the attribute path to the feature for the resource
       * @param {Object} [options]
       *    options and callbacks to use
       * @param {Function|Function[]} options.onReplace
       *    a function or a list of functions to call when a didReplace event is received. Each function
       *    receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called
       *    first the second time a didReplace event occurs.
       * @param {Function|Function[]} options.onUpdate
       *    a function or a list of functions to call when a didUpdate event is received. Each function
       *    receives the event object as argument.
       * @param {Function|Function[]} options.onUpdateReplace
       *    a function or a list of functions to call when a didUpdate or a didReplace event is received. Each
       *    function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is
       *    only called first for didReplace events the second time such an event occurs.
       * @param {Boolean} options.omitFirstReplace
       *    if `true` `options.onReplace` is only called after the
       *    first time a didReplace event occurred. Default is `false`
       * @param {String} options.modelKey
       *    the key to use for the resource in `scope.model` / `scope.resources`. If not given the last path
       *    fragment of `featurePath` is used. For example if the path is `myfeature.superResource` the key
       *    will be `superResource`.
       * @param {Boolean} options.isOptional
       *    If set to `true`, missing configuration for this resource is silently ignored and no handlers
       *    are registered. If set to `false`, an error will be raised in this case (default is `false`).
       *
       * @return {ResourceHandler}
       *    this instance
       */
      registerResourceFromFeature: function( featurePath, options ) {
         var resource = ax.object.path( this.scope_.features, featurePath + '.resource', null );
         options = ax.object.options( options, { isOptional: false } );
         if( resource === null && !!options.isOptional ) {
            return this;
         }
         assert( resource ).isNotNull( 'Could not find resource configuration in features for "' + featurePath + '"' );

         if( !options.modelKey ) {
            options.modelKey = featurePath.substr( featurePath.lastIndexOf( '.' ) + 1 );
         }

         return this.registerResource( resource, options );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Registers default event handlers for a known resource name. All replacements and updates will be
       * written to `scope.resources` if it is defined and of type `object`. In any other case `scope.model`
       * will be used.
       *
       * @param {String} resource
       *    the resource the handler should be registered for
       * @param {Object} [options]
       *    options and callbacks to use
       * @param {Function|Function[]} options.onReplace
       *    a function or a list of functions to call when a didReplace event is received. Each function
       *    receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called
       *    first the second time a didReplace event occurs.
       * @param {Function|Function[]} options.onUpdate
       *    a function or a list of functions to call when a didUpdate event is received. Each function
       *    receives the event object as argument.
       * @param {Function|Function[]} options.onUpdateReplace
       *    a function or a list of functions to call when a didUpdate or a didReplace event is received. Each
       *    function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is
       *    only called first for didReplace events the second time such an event occurs.
       * @param {Boolean} options.omitFirstReplace
       *    if `true` `options.onReplace` is only called after the first time a didReplace event occurred.
       *    Default is `false`
       * @param {String} options.modelKey
       *    the key to use for the resource in `scope.model` / `scope.resources`. If not given the value of
       *    `resource` is used.
       *
       * @return {ResourceHandler}
       *    this instance
       */
      registerResource: function( resource, options ) {
         assert( resource ).hasType( String ).isNotNull();

         options = _.defaults( ax.object.deepClone( options || {} ), {
            omitFirstReplace: false,
            modelKey: resource
         } );
         this.waitingFor_.push( resource );
         this.registerResourceHandlers_( resource, options );

         if( !( resource in this.modelHandlers_ ) ) {
            this.modelHandlers_[ resource ] = {};
         }

         this.registerForReplace_( resource, options );
         this.registerForUpdate_( resource, options );

         return this;
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Registers a callback that is called once all resources were initially replaced. If more resource
       * handlers are registered before all relevant didReplace events were received, those are also waited
       * for.
       *
       * @param {Function} callback
       *     the function to call
       * @param {Boolean} [options]
       *    an optional set of parameters to specify watch behavior
       * @param {Boolean} options.watch
       *    if `true`, the callback will be called again whenever resources are modified after all were
       *    replaced at least once.
       *
       * @return {ResourceHandler}
       *    this instance
       */
      whenAllWereReplaced: function( callback, options ) {
         assert( callback ).hasType( Function ).isNotNull();

         this.allReplacedCallback_ = options && options.watch ? callback : _.once( callback );

         return this;
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       * Allows to find out if there are still outstanding resources, or if all resources have been replaced.
       * Can be used in update-/replace-handlers to determine if all dependencies are satisfied.
       *
       * @return {Boolean}
       *    `true` if all resources registered with this handler (so far) have been replaced at least once,
       *    `false` if there are still outstanding resources.
       */
      wereAllReplaced: function() {
         return !this.waitingFor_.length;
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       *
       * @private
       */
      registerResourceHandlers_: function( resource, options ) {
         if( !this.externalHandlers_[ resource ] ) {
            this.externalHandlers_[ resource ] = {
               onReplace: [],
               onUpdate: []
            };
         }

         appendFunctionOrArrayOfFunctions( this.externalHandlers_[ resource ].onUpdate, options.onUpdate );
         appendFunctionOrArrayOfFunctions( this.externalHandlers_[ resource ].onUpdate, options.onUpdateReplace );

         var replaceHandlers = [];
         appendFunctionOrArrayOfFunctions( replaceHandlers, options.onReplace );
         appendFunctionOrArrayOfFunctions( replaceHandlers, options.onUpdateReplace );

         if( options.omitFirstReplace ) {
            replaceHandlers = replaceHandlers.map( function( handler ) {
               return _.after( 2, handler );
            } );
         }
         appendFunctionOrArrayOfFunctions( this.externalHandlers_[ resource ].onReplace, replaceHandlers );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       *
       * @private
       */
      registerForReplace_: function( resource, options ) {
         var handler = replaceHandler( this.scope_, options.modelKey );
         if( this.modelHandlers_[ resource ].onReplace ) {
            this.modelHandlers_[ resource ].onReplace.push( handler );
            return;
         }
         this.modelHandlers_[ resource ].onReplace = [ handler ];

         this.scope_.eventBus.subscribe( 'didReplace.' + resource, function( event ) {
            var changed = this.modelHandlers_[ resource ].onReplace.reduce( function( changed, handler ) {
               return handler( event ) || changed;
            }, false );
            if( !changed ) {
               return;
            }

            try {
               this.externalHandlers_[ resource ].onReplace.forEach( function( handler ) {
                  handler( event );
               } );
            }
            finally {
               this.waitingFor_ = _.without( this.waitingFor_, resource );
               if( !this.waitingFor_.length ) {
                  this.allReplacedCallback_();
               }
            }

         }.bind( this ) );
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      /**
       *
       * @private
       */
      registerForUpdate_: function( resource, options ) {
         var handler = updateHandler( this.scope_, options.modelKey );
         if( this.modelHandlers_[ resource ].onUpdate ) {
            this.modelHandlers_[ resource ].onUpdate.push( handler );
            return;
         }
         this.modelHandlers_[ resource ].onUpdate = [ handler ];

         this.scope_.eventBus.subscribe( 'didUpdate.' + resource, function( event ) {
            var changed = this.modelHandlers_[ resource ].onUpdate.reduce( function( changed, handler ) {
               return handler( event ) || changed;
            }, false );
            if( !changed ) {
               return;
            }

            try {
               this.externalHandlers_[ resource ].onUpdate.forEach( function( handler ) {
                  handler( event );
               } );
            }
            finally {
               if( !this.waitingFor_.length ) {
                  this.allReplacedCallback_();
               }
            }
         }.bind( this ) );
      }

   };

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @private
    */
   function appendFunctionOrArrayOfFunctions( target, funcOrArray ) {
      if( typeof funcOrArray === 'function' ) {
         target.push( funcOrArray );
         return;
      }

      if( _.isArray( funcOrArray ) ) {
         Array.prototype.push.apply( target, funcOrArray );
      }
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    *
    * @private
    */
   function provideResourceBucket( scope, preferredBucket ) {
      var resourceBucket = {};
      if( scope.hasOwnProperty( preferredBucket ) && typeof scope[ preferredBucket ] === 'object' ) {
         resourceBucket = scope[ preferredBucket ];
      }
      else if( typeof scope.model === 'object' ) {
         resourceBucket = scope.model;
      }
      else {
         scope.model = resourceBucket;
      }
      return resourceBucket;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   /**
    * Tests if two objects represent the same resource.
    *
    * The test takes place as follows:
    *  * Let value of `counter` be zero.
    *  * For each attribute in `attribute` test the following:
    *    ** If both objects contain the attribute, check for identity using `===`.
    *       *** If this check is negative, skip further testing and let the result of the function be `false`.
    *       *** If it is positive, increment `counter`.
    *    ** If none of the objects contains the attribute, skip to the next attribute.
    *    ** If the attribute exist only in one of the objects, skip further testing and let the result of the
    *       function be `false`.
    *  * If all attributes have been tested and the value of `counter` is greater than zero, let the result
    *    of the function be `true`, `false` otherwise.
    *
    * @param {Object} resourceA
    *    the first object to test
    * @param {Object} resourceB
    *    the second object to test
    * @param {String[]} attributes
    *    the list of attributes determining resource identity
    *
    * @return {Boolean}
    *    `true` if both objects are assumed to represent the same resource, `false` otherwise
    */
   function isSame( resourceA, resourceB, compareAttributes ) {
      if( resourceA == null || resourceB == null ) {
         return false;
      }

      var matches = 0;
      for( var i = 0; i < compareAttributes.length; ++i ) {
         var key = compareAttributes[ i ];
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
      return matches > 0;
   }

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   return {

      replaceHandler: replaceHandler,
      updateHandler: updateHandler,
      replacePublisherForFeature: replacePublisherForFeature,
      updatePublisherForFeature: updatePublisherForFeature,
      isSame: isSame,
      handlerFor: handlerFor

   };

} );
