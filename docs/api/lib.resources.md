
# <a id="resources"></a>resources

This module provides helpers for patterns regarding *didReplace* and *didUpdate* events.

## Contents

**Module Members**

- [replacePublisherForFeature()](#replacePublisherForFeature)
- [updatePublisherForFeature() **(Deprecated)**](#updatePublisherForFeature)
- [handlerFor()](#handlerFor)

**Types**

- [ResourceHandler](#ResourceHandler)
  - [ResourceHandler.registerResourceFromFeature()](#ResourceHandler.registerResourceFromFeature)
  - [ResourceHandler.registerResource()](#ResourceHandler.registerResource)
  - [ResourceHandler.whenAllWereReplaced()](#ResourceHandler.whenAllWereReplaced)
  - [ResourceHandler.wereAllReplaced()](#ResourceHandler.wereAllReplaced)

## Module Members

#### <a id="replacePublisherForFeature"></a>replacePublisherForFeature( context, featurePath, optionalOptions )

Creates and returns a function to publish *didReplace* events for the resource found as feature
configuration. Resolution of the `featurePath` argument works just as explained in the documentation for
[`#ResourceHandler.registerResourceFromFeature`](#ResourceHandler.registerResourceFromFeature). The publisher returns the promise returned by
the underlying event bus call.

By default a handler for `replaceRequest` events of the underlying resource is added. This handler
caches the most recently published version of a resource and publishes it again, if a `replaceRequest`
event for this resource is received. Note that eny changes imposed on the resource via `didUpdate` events
are ignored and won't be reflected on the cached resource.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |
| featurePath | `String` |  the property of `context.features` the publisher reads the resource name from |
| _optionalOptions_ | `Object` |  options for the publisher |
| _optionalOptions.deliverToSender_ | `Boolean` |  the value is forwarded to `eventBus.publish`: if `true` the event will also be delivered to the publisher. Default is `false` |
| _optionalOptions.isOptional_ | `Boolean` |  if `true`, a missing `featurePath.resource` is ignored and the returned publisher won't do anything when called. Default is `false`. |
| _optionalOptions.replaceRequestHandler_ | `Function`, `Boolean` |  if `false`, replace request support is disabled. if `true`, `replaceRequest` events are automatically handled by using an internal cache for the last version of the resource. If a function is provided, internal caching is disabled, and instead the given handler is asked to return a promise for the resource to publish. Default is `true`. |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Function` |  the publisher function. Takes the data to publish as single argument |

#### <a id="updatePublisherForFeature"></a>updatePublisherForFeature( context, featurePath, optionalOptions )

**Deprecated:**

> In practice updates as a resource pattern turned out to be rather error prone and difficult to manage
   correctly. In our experience sending the complete resource via `didReplace` on change again is much
   simpler and removes potential overhead while calculating the patches. You may still use `didUpdate`
   events in your application, but pattern support will be dropped without replacement, probably in the
   next major release.

Creates and returns a function to publish *didUpdate* events for the resource found as feature
configuration. Resolution of the `featurePath` argument works just as explained in the documentation for
[`#ResourceHandler.registerResourceFromFeature`](#ResourceHandler.registerResourceFromFeature). The publisher returns the promise returned by
the underlying event bus call. The returned function only accepts one argument, which is the JSON patch
sequence conforming to [RFC 6902](https://tools.ietf.org/html/rfc6902).

Example:
```js
const publisher = resources.updatePublisherForFeature( context, path );
publisher( [
   { op: 'remove', path: '/accounts/2' },
   { op: 'replace', path: '/contacts/hans/number', value: '+49 123 4563432' }
] );
```

Additionally the returned function has a method `compareAndPublish` that accepts the previous version of
a resource as first argument and the current version of the resource as second argument. It then creates
the JSON patch sequence itself and sends the according didUpdate event. It also returns the promise
returned by the underlying event bus call.

Example:
```js
const publisher = resources.updatePublisherForFeature( context, path );
publisher.compareAndPublish( obsoleteVersion, currentVersion );
```

Note that a generic generation of patches might lead to strange, large patch sequences, especially when
removing entries. The diff library doesn't know about identities and as such won't recognize where a
specific element was removed. As a consequence instead of generating a remove operation, this could
result in a very large number of *replace* operations that shift the properties from successors to the
front in order to overwrite instead of remove the entry.
In such cases one is better off by manually creating a patch with operation *remove*, as the knowledge
about the domain is available at the user of this publisher.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |
| featurePath | `String` |  the property of `context.features` the publisher reads the resource name from |
| _optionalOptions_ | `Object` |  options for the publisher |
| _optionalOptions.deliverToSender_ | `Boolean` |  the value is forward to `eventBus.publish`: if `true` the event will also be delivered to the publisher. Default is `false` |
| _optionalOptions.isOptional_ | `Boolean` |  if `true`, a missing `featurePath.resource` is ignored and the returned publisher won't do anything when called. Default is `false`. |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Function` |  the publisher function as described above |

#### <a id="handlerFor"></a>handlerFor( context )

Creates a new handler instance for *didReplace* and *didUpdate* events. It already handles setting of the
resource data on *didReplace* in the `context.resources` property and updating that data on *didUpdate*
events.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`ResourceHandler`](#ResourceHandler) |  a resource handler instance |

## Types

### <a id="ResourceHandler"></a>ResourceHandler

#### <a id="ResourceHandler.registerResourceFromFeature"></a>ResourceHandler.registerResourceFromFeature( featurePath, optionalOptions )

Registers default event handlers for a feature. The `feature` argument is interpreted as attribute
path to an object having a `resource` property of type string holding the name of the resource to
register the handler for. All replacements and updates will be written to `context.resources` according to
the rules found at the `optionalOptions.modelKey` doc.

Example:
Consider the following configuration:
```json
{
   "features": {
      "someFeature": {
         "someResourceConfig": {
            "resource": "myResource"
         }
      }
   }
}
```

The corresponding call would be (providing none of the options):

```js
resources.handlerFor( context )
   .registerResourceFromFeature( 'someFeature.someResourceConfig' );
```

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| featurePath | `String` |  the attribute path to the feature for the resource |
| _optionalOptions_ | `Object`, `Function` |  options and callbacks to use. If a function is passed, it is used as the `onUpdateReplace` option. |
| _optionalOptions.onReplace_ | `Function`, `Array.<Function>` |  a function or a list of functions to call when a didReplace event is received. Each function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called first the second time a didReplace event occurs |
| _optionalOptions.onUpdate_ | `Function`, `Array.<Function>` |  a function or a list of functions to call when a didUpdate event is received. Each function receives the event object as argument |
| _optionalOptions.onUpdateReplace_ | `Function`, `Array.<Function>` |  a function or a list of functions to call when a didUpdate or a didReplace event is received. Each function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is not called for the first received didReplace event |
| _optionalOptions.omitFirstReplace_ | `Boolean` |  if `true` `options.onReplace` is only called after the first time a didReplace event occurred. Default is `false` |
| _optionalOptions.modelKey_ | `String` |  the key to use for the resource in `context.resources`. If not given the last path fragment of `featurePath` is used. For example if the path is `myFeature.superResource` the key will be `superResource` |
| _optionalOptions.isOptional_ | `Boolean` |  if set to `true`, missing configuration for this resource is silently ignored and no handlers are registered. If set to `false`, an error will be raised in this case (default is `false`) |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`ResourceHandler`](#ResourceHandler) |  this instance for chaining |

#### <a id="ResourceHandler.registerResource"></a>ResourceHandler.registerResource( resource, optionalOptions )

Registers default event handlers for a known resource name.All replacements and updates will be written to
`context.resources` according to the rules found at the `optionalOptions.modelKey` doc.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| resource | `String` |  the resource the handler should be registered for |
| _optionalOptions_ | `Object`, `Function` |  options and callbacks to use. If a function is passed, it is used as the `onUpdateReplace` option. |
| _optionalOptions.onReplace_ | `Function`, `Array.<Function>` |  a function or a list of functions to call when a didReplace event is received. Each function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called first the second time a didReplace event occurs |
| _optionalOptions.onUpdate_ | `Function`, `Array.<Function>` |  a function or a list of functions to call when a didUpdate event is received. Each function receives the event object as argument |
| _optionalOptions.onUpdateReplace_ | `Function`, `Array.<Function>` |  a function or a list of functions to call when a didUpdate or a didReplace event is received. Each function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called first for didReplace events the second time such an event occurs |
| _optionalOptions.omitFirstReplace_ | `Boolean` |  if `true` `options.onReplace` is only called after the first time a didReplace event occurred. Default is `false` |
| _optionalOptions.modelKey_ | `String` |  the key to use for the resource in `context.resources`. If not given the value of `resource` is used |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`ResourceHandler`](#ResourceHandler) |  this instance for chaining |

#### <a id="ResourceHandler.whenAllWereReplaced"></a>ResourceHandler.whenAllWereReplaced( callback, optionalOptions )

Registers a callback that is called once all registered resources were initially replaced. If more resource
handlers are registered before all relevant didReplace events were received, those are also waited
for.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| callback | `Function` |  the function to call |
| _optionalOptions_ | `Boolean` |  an optional set of parameters to specify watch behavior |
| _optionalOptions.watch_ | `Boolean` |  if `true`, the callback will be called again whenever resources are modified after all were replaced at least once |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`ResourceHandler`](#ResourceHandler) |  this instance for chaining |

#### <a id="ResourceHandler.wereAllReplaced"></a>ResourceHandler.wereAllReplaced()

Allows to find out if there are still outstanding resources, or if all resources have been replaced.
Can be used in update-/replace-handlers to determine if all dependencies are satisfied.

##### Returns

| Type | Description |
| ---- | ----------- |
| `Boolean` |  `true` if all resources registered with this handler (so far) have been replaced at least once, `false` if there are still outstanding resources |
