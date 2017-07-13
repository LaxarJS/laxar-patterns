
# resources

This module provides helpers for patterns regarding *didReplace* and *didUpdate* events.

Definition of the `context` object mentioned throughout this api:

In the simplest case this can be the AngularJS `$scope` passed into a widget. Technically this can be
any object exposing these three properties:
- `eventBus`: The event bus instance used for event subscriptions and publishing events
- `features`: The configuration of the widget, used for automagical resource handling
- `resources`: An object where all registered resources and updates to them are written to. Will be
  added if it doesn't exist.

## Contents

**Module Members**
- [replaceHandler](#replaceHandler)
- [updateHandler](#updateHandler)
- [replacePublisherForFeature](#replacePublisherForFeature)
- [updatePublisherForFeature](#updatePublisherForFeature)
- [handlerFor](#handlerFor)
- [isSame](#isSame)

**Types**
- [ResourceHandler](#ResourceHandler)
  - [ResourceHandler#registerResourceFromFeature](#ResourceHandler#registerResourceFromFeature)
  - [ResourceHandler#registerResource](#ResourceHandler#registerResource)
  - [ResourceHandler#whenAllWereReplaced](#ResourceHandler#whenAllWereReplaced)
  - [ResourceHandler#wereAllReplaced](#ResourceHandler#wereAllReplaced)

## Module Members
#### <a name="replaceHandler"></a>replaceHandler( context, modelKey )
Creates and returns a simple handler function for didReplace events. Replaces will be written to
`context.resources` under the given value for `modelKey`.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `Object` |  the context the handler works on |
| modelKey | `String` |  the property of `context.resources` the handler writes replaces to |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Function` |  the handler function |

#### <a name="updateHandler"></a>updateHandler( context, modelKey )
Creates and returns a simple handler function for didUpdate events. Updates will be written to
`context.resources` under the given value for `modelKey`.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `Object` |  the context the handler works on |
| modelKey | `String` |  the property of `context.resources` the handler applies updates to |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Function` |  the handler function |

#### <a name="replacePublisherForFeature"></a>replacePublisherForFeature( context, featurePath, optionalOptions )
Creates and returns a function to publish didReplace events for the resource found as feature
configuration. Resolution of the `featurePath` argument works just as explained in the documentation for
[ResourceHandler#registerResourceFromFeature](#ResourceHandler#registerResourceFromFeature). The publisher returns the promise returned by
the underlying event bus call.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `Object` |  the context the publisher works on |
| featurePath | `String` |  the property of `context.features` the publisher reads the resource name from |
| _optionalOptions_ | `Object` |  options for the publisher |
| _optionalOptions.deliverToSender_ | `Boolean` |  the value is forwarded to `eventBus.publish`: if `true` the event will also be delivered to the publisher. Default is `false` |
| _optionalOptions.isOptional_ | `Boolean` |  if `true`, don't throw an error if `featurePath.resource` is missing. Instead return a publisher that doesn't do anything when called. Default is `false`. |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Function` |  the publisher function. Takes the data to publish as single argument |

#### <a name="updatePublisherForFeature"></a>updatePublisherForFeature( context, featurePath, optionalOptions )
Creates and returns a function to publish didUpdate events for the resource found as feature
configuration. Resolution of the `featurePath` argument works just as explained in the documentation for
[ResourceHandler#registerResourceFromFeature](#ResourceHandler#registerResourceFromFeature). The publisher returns the promise returned by
the underlying event bus call. The returned function only accepts one argument, which is the JSON patch
sequence conforming to [RFC 6902](https://tools.ietf.org/html/rfc6902).

Example:
```js
var publisher = resources.updatePublisherForFeature( context, path );
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
var publisher = resources.updatePublisherForFeature( context, path );
publisher.compareAndPublish( obsoleteVersion, currentVersion );
```

Note that a generic generation of patches might lead to strange, large patch sequences, especially when
removing entries. The diff library doesn't know about identities and as such won't recognize where a
specific element was removed. As a consequence instead of generating a remove operation, this could
result in a very large number of replace operations that shift the properties from successors to the
front in order to overwrite instead of remove the entry.
In such cases one is better off by manually creating a patch with operation remove, as the knowledge
about the domain is available at the user of this publisher.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `Object` |  the context the publisher works on |
| featurePath | `String` |  the property of `context.features` the publisher reads the resource name from |
| _optionalOptions_ | `Object` |  options for the publisher |
| _optionalOptions.deliverToSender_ | `Boolean` |  the value is forward to `eventBus.publish`: if `true` the event will also be delivered to the publisher. Default is `false` |
| _optionalOptions.isOptional_ | `Boolean` |  if `true`, don't throw an error if `featurePath.resource` is missing. Instead return a publisher that doesn't do anything when called. Default is `false`. |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Function` |  the publisher function as described above |

#### <a name="handlerFor"></a>handlerFor( context )
Creates a new handler instance for didReplace and didUpdate events. It already handles setting of the
resource data on didReplace in the context.resources property and updating that data on didUpdate events.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `Object` |  the context the handler should work with. It expects to find an `eventBus` property there with which it can do the event handling |

##### Returns
| Type | Description |
| ---- | ----------- |
| `ResourceHandler` |  a resource handler instance |

#### <a name="isSame"></a>isSame( resourceA, resourceB, compareAttributes )
Tests if two objects represent the same resource.

The test takes place as follows:
 - Let value of `counter` be zero.
 - For each attribute (or attribute path) in `attribute` test the following:
   - If both objects contain the attribute (or a defined value at the given path), check for
      identity using `===`.
      - If this check is negative, skip further testing and let the result of the function be `false`.
      - If it is positive, increment `counter`.
   - If none of the objects contains the attribute (or a defined value at the given path), skip to
      the next attribute.
   - If the attribute (or a defined value at the given path) exist only in one of the objects, skip
      further testing and let the result of the function be `false`.
 - If all attributes have been tested and the value of `counter` is greater than zero, let the result
   of the function be `true`, `false` otherwise.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| resourceA | `Object` |  the first object to test |
| resourceB | `Object` |  the second object to test |
| compareAttributes | `Array.<String>` |  the list of attributes determining resource identity |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Boolean` |  `true` if both objects are assumed to represent the same resource, `false` otherwise |

## Types
### <a name="ResourceHandler"></a>ResourceHandler

#### <a name="ResourceHandler#registerResourceFromFeature"></a>ResourceHandler#registerResourceFromFeature( featurePath, optionalOptions )
Registers default event handlers for a feature. The `feature` argument is interpreted as attribute
path to an object having a `resource` property of type string holding the name of the resource to
register the handler for. All replacements and updates will be written to `context.resources` by the
rules written at `options.modelKey` doc.

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
The according call, using an AngularJS Scope as context, would be (providing none of the options):
```js
patterns.resources,handlerFor( $scope )
   .registerResourceFromFeature( 'someFeature.someResourceConfig' );
```

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| featurePath | `String` |  the attribute path to the feature for the resource |
| _optionalOptions_ | `Object`, `Function` |  options and callbacks to use. If a function is passed, it is used as the `onUpdateReplace` option. |
| _optionalOptions.onReplace_ | `Function`, `Array.<Function>` |  a function or a list of functions to call when a didReplace event is received. Each function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called first the second time a didReplace event occurs |
| _optionalOptions.onUpdate_ | `Function`, `Array.<Function>` |  a function or a list of functions to call when a didUpdate event is received. Each function receives the event object as argument |
| _optionalOptions.onUpdateReplace_ | `Function`, `Array.<Function>` |  a function or a list of functions to call when a didUpdate or a didReplace event is received. Each function receives the event object as argument. If `options.omitFirstReplace` is `true`, it is only called first for didReplace events the second time such an event occurs |
| _optionalOptions.omitFirstReplace_ | `Boolean` |  if `true` `options.onReplace` is only called after the first time a didReplace event occurred. Default is `false` |
| _optionalOptions.modelKey_ | `String` |  the key to use for the resource in `context.resources`. If not given the last path fragment of `featurePath` is used. For example if the path is `myfeature.superResource` the key will be `superResource` |
| _optionalOptions.isOptional_ | `Boolean` |  if set to `true`, missing configuration for this resource is silently ignored and no handlers are registered. If set to `false`, an error will be raised in this case (default is `false`) |

##### Returns
| Type | Description |
| ---- | ----------- |
| `ResourceHandler` |  this instance for chaining |

#### <a name="ResourceHandler#registerResource"></a>ResourceHandler#registerResource( resource, optionalOptions )
Registers default event handlers for a known resource name. All replacements and updates will be
written to `context.resources`.

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
| `ResourceHandler` |  this instance for chaining |

#### <a name="ResourceHandler#whenAllWereReplaced"></a>ResourceHandler#whenAllWereReplaced( callback, optionalOptions )
Registers a callback that is called once all resources were initially replaced. If more resource
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
| `ResourceHandler` |  this instance for chaining |

#### <a name="ResourceHandler#wereAllReplaced"></a>ResourceHandler#wereAllReplaced()
Allows to find out if there are still outstanding resources, or if all resources have been replaced.
Can be used in update-/replace-handlers to determine if all dependencies are satisfied.

##### Returns
| Type | Description |
| ---- | ----------- |
| `Boolean` |  `true` if all resources registered with this handler (so far) have been replaced at least once, `false` if there are still outstanding resources |
