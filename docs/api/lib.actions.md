
# <a id="actions"></a>actions

This module provides helpers for patterns regarding *takeActionRequest*, *willTakeAction* and
*didTakeAction* events.

## Contents

**Module Members**

- [OUTCOME_SUCCESS](#OUTCOME_SUCCESS)
- [OUTCOME_ERROR](#OUTCOME_ERROR)
- [publisherForFeature()](#publisherForFeature)
- [publisher()](#publisher)
- [connectPublisherToFeature()](#connectPublisherToFeature)
- [handlerFor()](#handlerFor)

**Types**

- [ActionHandler](#ActionHandler)
  - [ActionHandler.registerActionsFromFeature()](#ActionHandler.registerActionsFromFeature)
  - [ActionHandler.registerActions()](#ActionHandler.registerActions)

## Module Members

#### <a id="OUTCOME_SUCCESS"></a>OUTCOME_SUCCESS `String`

Constant for the value `"SUCCESS"` of a successful action request outcome.

#### <a id="OUTCOME_ERROR"></a>OUTCOME_ERROR `String`

Constant for the value `"ERROR"` of an erronoues action request outcome.

#### <a id="publisherForFeature"></a>publisherForFeature( context, feature, optionalOptions )

Creates and returns a function to publish *takeActionRequest* events for an action configured as feature.
The action to publish is expected to be at the key `action` under the given feature path.
So if the given feature path is `click`, the actual name of the action is expected to be found at
`context.features.click.action`.

Apart from that this function works just like [`#publisher()`](#publisher).

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |
| feature | `String` |  the feature to take the action name from |
| _optionalOptions_ | `Object` |  options for the publisher |
| _optionalOptions.deliverToSender_ | `Boolean` |  the value is forwarded to `eventBus.publishAndGatherReplies`: if `true` the event will also be delivered to the publisher. Default is `false` |
| _optionalOptions.optional_ | `Boolean` |  if `true`, a missing feature configuration will result in a noop publisher. Else, a missing feature configuration results in a thrown error. Default is `false` |
| _optionalOptions.timeout_ | `Boolean` |  the value is forwarded to `eventBus.publishAndGatherReplies` as value of `pendingDidTimeout` |
| _optionalOptions.onSuccess_ | `Function` |  a function that is called when the overall outcome yields [`#OUTCOME_SUCCESS`](#OUTCOME_SUCCESS) |
| _optionalOptions.onError_ | `Function` |  a function that is called when the overall outcome yields [`#OUTCOME_ERROR`](#OUTCOME_ERROR) |
| _optionalOptions.onComplete_ | `Function` |  a function that is called always, independently of the overall outcome, when all events in response were received |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Function` |  the publisher as described above |

#### <a id="publisher"></a>publisher( context, action, optionalOptions )

Creates and return a function to publish *takeActionRequest* events for a given action.
The outcomes of all given *didTakeAction* events are interpreted and optional callbacks according to the
overall outcome are called.
Interpretation is simple: If at least one *didTakeAction* event yields the outcome [`#OUTCOME_ERROR`](#OUTCOME_ERROR),
the overall outcome is also erroneous.
In any other case the overall outcome will be successful.

The promise returned by the publisher is resolved with an object carrying all responses and the outcome of
the action.
All `on*` handlers will only receive the list of responses to the action.
A response is an object having the keys `meta` and `event`, being the meta and event objects of a
`didTakeAction` event (see `EventBus#publishAndGatherReplies()` for details).

Example:
```js
publisher = actions.publisher( context, 'save', {
   onSuccess: () => { closeApplication(); },
   onError: () => { displayError(); }
} );

$button.on( 'click', () => {
   publisher().then( result => {
      console.log( result ); // for example { responses: [ ... ], outcome: 'SUCCESS' }
   } );
} );
```

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |
| action | `String` |  the action to publish on call of the publisher |
| _optionalOptions_ | `Object` |  options for the publisher |
| _optionalOptions.deliverToSender_ | `Boolean` |  the value is forward to `eventBus.publishAndGatherReplies`: if `true` the event will also be delivered to the publisher. Default is `false` |
| _optionalOptions.timeout_ | `Boolean` |  the value is forwarded to `eventBus.publishAndGatherReplies` as value of `pendingDidTimeout` |
| _optionalOptions.onSuccess_ | `Function` |  a function that is called when the overall outcome yields [`#OUTCOME_SUCCESS`](#OUTCOME_SUCCESS) |
| _optionalOptions.onError_ | `Function` |  a function that is called when the overall outcome yields [`#OUTCOME_ERROR`](#OUTCOME_ERROR) |
| _optionalOptions.onComplete_ | `Function` |  a function that is called always, independently of the overall outcome, when all events in response were received |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Function` |  the publisher as described above |

#### <a id="connectPublisherToFeature"></a>connectPublisherToFeature( context, feature, optionalOptions )

Creates an action publisher for a given feature and makes it available as a context property.

The publisher is created under ``context[ `actions.${feature}` ]``, where `context` and `feature`
are the arguments passed to this function. If an action topic has been configured for the given feature,
the action publisher is created using `publisherForFeature`. Otherwise, it is a noop-function.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |
| feature | `String` |  the feature to take the action name from |
| _optionalOptions_ | `Object` |  options for the publisher, as documented under `publisherForFeature` |

#### <a id="handlerFor"></a>handlerFor( context )

Creates a new action handler instance for *takeActionRequest* events. It handles sending of an optional
*willTakeAction* event and the following *didTakeAction* event, possibly following asynchronously later.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`ActionHandler`](#ActionHandler) |  an action handler instance |

## Types

### <a id="ActionHandler"></a>ActionHandler

#### <a id="ActionHandler.registerActionsFromFeature"></a>ActionHandler.registerActionsFromFeature( feature, handler )

Registers a handler for *takeActionRequest* events with actions from a feature. It is assumed that the
given feature has an `onActions` property, which is a set of actions to listen to. The set may be empty,
`null` or `undefined`, in which case the handler simply won't be attached to any event.

Apart from that, this function works just like [`ActionHandler#registerActions`](lib.actions.md#registerActions).

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
actions.handlerFor( context )
   .registerActionsFromFeature( 'open', ( event, meta ) => {
      somethingSynchronous();
      return actions.OUTCOME_SUCCESS;
   } )
   .registerActionsFromFeature( 'save', ( event, meta ) => {
      return Promise.resolve( somethingAsynchronous() );
   } );
```

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| feature | `String` |  the feature to read the actions to watch from |
| handler | `Function` |  the handler to call whenever a *takeActionRequest* event with matching action is received |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`ActionHandler`](#ActionHandler) |  this instance for chaining |

#### <a id="ActionHandler.registerActions"></a>ActionHandler.registerActions( actions, handler )

Registers a handler for *takeActionRequest* events for a set of actions. The set may be empty, in
which case the handler simply won't be attached to any event.

The handler is assumed to be a function that receives the event and meta object of the underlying
*takeActionRequest* event when called. In order to send the correct *didTakeAction* event as response,
the return value of the handler is interpreted according to the following rules:

- the handler throws an error
  - the *didTakeAction* event is sent with outcome [`#OUTCOME_ERROR`](#OUTCOME_ERROR)
  - the error is re-thrown
- the handler returns a simple value or a promise, that is later resolved with a value
  - if the value is a plain object, it is used as basis for the event object and
    - if the object has a property `outcome` with value [`#OUTCOME_ERROR`](#OUTCOME_ERROR), the *didTakeAction* event
      is sent with outcome [`#OUTCOME_ERROR`](#OUTCOME_ERROR)
  - otherwise, or if the value is no plain object, the *didTakeAction* event is sent with outcome
    [`#OUTCOME_SUCCESS`](#OUTCOME_SUCCESS)
- the handler returns a promise, that is later rejected with a value
  - if the value is a plain object, it is used as basis for the event object and
    - if the object has a property `outcome` with value [`#OUTCOME_SUCCESS`](#OUTCOME_SUCCESS), the *didTakeAction*
      event is sent with outcome [`#OUTCOME_SUCCESS`](#OUTCOME_SUCCESS)
  - otherwise, or if the value is no plain object, the *didTakeAction* event is sent with outcome
    [`#OUTCOME_ERROR`](#OUTCOME_ERROR)

So basically simple return values or resolved promises are assumed to be successful if they don't state
otherwise, while rejected promises are assumed to be erroneous, if they don't state otherwise.

Example:
```js
actions.handlerFor( context )
   .registerActions( [ 'open' ], ( event, meta ) => 42 )
   .registerActions( [ 'save' ], ( event, meta ) => Promise.resolve( { resultValue: 42 } ) );
```

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| actions | `Array.<String>` |  a set of actions to watch |
| handler | `Function` |  the handler to call whenever a *takeActionRequest* event with matching action is received |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`ActionHandler`](#ActionHandler) |  this instance for chaining |
