
# actions

This module provides helpers for patterns regarding *takeActionRequest*, *willTakeAction* and
*didTakeAction* events.

## Contents

**Module Members**
- [publisherForFeature](#publisherForFeature)
- [publisher](#publisher)
- [handlerFor](#handlerFor)

**Types**
- [ActionHandler](#ActionHandler)
  - [ActionHandler#registerActionsFromFeature](#ActionHandler#registerActionsFromFeature)
  - [ActionHandler#registerActions](#ActionHandler#registerActions)

## Module Members
#### <a name="publisherForFeature"></a>publisherForFeature( scope, feature, optionalOptions )
Creates and returns a function to publish `takeActionRequest` events for a given action feature. The
action to publish is expected to be at the key `action` under the given feature path.

Apart from that this function works just like [publisher](#publisher).

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| scope | `Object` | the scope the publisher works on. Needs at least an EventBus instance as `eventBus` property |
| feature | `String` | the feature to take the action name from |
| _optionalOptions_ | `Object` | options for the publisher |
| _optionalOptions.deliverToSender_ | `Boolean` | the value is forward to `eventBus.publishAndGatherReplies`: if `true` the event will also be delivered to the publisher. Default is `false` |
| _optionalOptions.onSuccess_ | `Function` | a function that is called when the overall outcome yields "SUCCESS" |
| _optionalOptions.onError_ | `Function` | a function that is called when the overall outcome yields "ERROR" |
| _optionalOptions.onComplete_ | `Function` | a function that is called always, independently of the overall outcome |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Function` | the publisher as described above |

#### <a name="publisher"></a>publisher( scope, action, optionalOptions )
Creates and returns a function to publish `takeActionRequest` events for a given action. The outcomes of
all given `didTakeAction` events are interpreted and optional callbacks according to the overall outcome
are called. Interpretation is simple: If at least one `didTakeAction` event yields the outcome "ERROR",
the overall outcome is also erroneous. In any other case the overall outcome will be successful.

The promise returned by the publisher is resolved, if the overall outcome is successful and rejected if
the outcome is erroneous. All callbacks, be it the `on*` handlers or the then handlers of the promise,
will receive the list of events and meta information of all `didTakeAction` events
(see `EventBus#publishAndGatherReplies()` for details).

Example:
```js
publisher = actions.publisher( scope, 'save', {
   onSuccess: function() { closeApplication(); },
   onError: function() { displayError(); }
} );

$button.on( 'click', publisher );
```

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| scope | `Object` | the scope the publisher works on. Needs at least an EventBus instance as `eventBus` property |
| action | `String` | the action to publish on call of the publisher |
| _optionalOptions_ | `Object` | options for the publisher |
| _optionalOptions.deliverToSender_ | `Boolean` | the value is forward to `eventBus.publishAndGatherReplies`: if `true` the event will also be delivered to the publisher. Default is `false` |
| _optionalOptions.onSuccess_ | `Function` | a function that is called when the overall outcome yields "SUCCESS" |
| _optionalOptions.onError_ | `Function` | a function that is called when the overall outcome yields "ERROR" |
| _optionalOptions.onComplete_ | `Function` | a function that is called always, independently of the overall outcome |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Function` | the publisher as described above |

#### <a name="handlerFor"></a>handlerFor( scope )
Creates a new action handler instance for `takeActionRequest` events. It handles sending of an optional
`willTakeAction` event and the final, possibly later asynchronously following `didTakeAction` event.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| scope | `Object` | the scope the handler should work with. It is expected to find an `eventBus` property there with which it can do the event handling |

##### Returns
| Type | Description |
| ---- | ----------- |
| `ActionHandler` | an action handler instance |

## Types
### <a name="ActionHandler"></a>ActionHandler

#### <a name="ActionHandler#registerActionsFromFeature"></a>ActionHandler#registerActionsFromFeature( feature, handler )
Registers a handler for `takeActionRequest` events with actions from a feature. It is assumed that the
given feature has an `onActions` property, which is a set of actions to listen to. The set may be empty,
`null` or `undefined`, in which case the handler simply won't be attached to any event.

Apart from that this function works just like [ActionHandler#registerActions](#ActionHandler#registerActions).

Example:
Consider the following configuration for a widget:
```json
{
   "features": {
      "open": {
         "onActions": [ "openAction1", "openAction2" ]
      },
      "save": {
         "onActions": [ "save" ]
      }
   }
}
```
An example using that would be:
```js
actions.handlerFor( scope )
   .registerActionsFromFeature( 'open', function( event, meta ) {
      somethingSynchronous();
      return actions.OUTCOME_SUCCESS;
   } )
   .registerActionsFromFeature( 'save', function( event, meta ) {
      return $q.when( somethingAsynchronous() );
   } );
```

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| feature | `String` | the feature to read the actions to watch from |
| handler | `Function` | the handler to call whenever a `takeActionRequest` event with matching action is received |

##### Returns
| Type | Description |
| ---- | ----------- |
| `ActionHandler` | this instance for chaining |

#### <a name="ActionHandler#registerActions"></a>ActionHandler#registerActions( actions, handler )
Registers a handler for `takeActionRequest` events for a set of actions. The set may be empty, in
which case the handler simply won't be attached to any event.

The handler is assumed to be a function that receives the event and meta object of the underlying
`takeActionRequest` event when called. In order to send the correct `didTakeAction` event as response,
the return value of the handler is interpreted according to the following rules:

- the handler throws an error
  - the `didTakeAction` event is sent with outcome `ERROR`
  - the error is re-thrown
- the handler returns a simple value or a promise, that is later resolved with a value
  - if the value is a plain object, it is used as basis for the event object and
    - if the object has a property `outcome` with value `ERROR`, the `didTakeAction` event is sent with
      outcome `ERROR`
  - otherwise, or if the value is no plain object, the `didTakeAction` event is sent with outcome
    `SUCCESS`
- the handler returns a promise, that is later rejected with a value
  - if the value is a plain object, it is used as basis for the event object and
    - if the object has a property `outcome` with value `SUCCESS`, the `didTakeAction` event is sent with
    outcome `SUCCESS`
  - otherwise, or if the value is no plain object, the `didTakeAction` event is sent with outcome `ERROR`

So basically simple return values or resolved promises are assumed to be successful if they don't state
otherwise, while rejected promises are assumed to be erroneous, if they don't state otherwise.

Example:
```js
actions.handlerFor( scope )
   .registerActions( [ 'open' ], function( event, meta ) {
      return 42
   } )
   .registerActions( [ 'save' ], function( event, meta ) {
      return $q.when( { resultValue: 42 } );
   } );
```

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| actions | `Array.<String>` | a set of actions to watch |
| handler | `Function` | the handler to call whenever a `takeActionRequest` event with matching action is received |

##### Returns
| Type | Description |
| ---- | ----------- |
| `ActionHandler` | this instance for chaining |
