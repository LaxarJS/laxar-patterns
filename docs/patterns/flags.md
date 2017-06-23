[« return to the patterns overview](../index.md)

# Flag Patterns

LaxarJS widgets use _flags_ to communicate boolean application state _(true/false)_, usually to control parts of the user interface.
For example, a flag might be used by an activity to indicate that some resource is currently in a _dirty_ state, or that a _popup_ layer is currently open.
Consumers of flags respond to the state changes: a "save" button should be active _while_ a resource is in the dirty state, and an animation on the main page should be paused _while_ a popup is open.

As with resources and actions, flags are defined by the page configuration.


### The _didChangeFlag_ Event

Widgets that publish boolean state may do so by publishing a `didChangeFlag` event.
To avoid race conditions, only one widget should be configured to publish state for a given flag on any single page.

Consumers of the `didChangeFlag` event react simply by adapting to the modified state.
Usually, flag consumers take an arbitrary number of flag topics (configurable as an array in their features).
Consumers should consider the overall flag state to be true if any of their subscribed flags is _true_.
If no state as been received yet for a single flag, consumers should consider it to be _false_.

| Event name                         | Payload Attribute  | Type    | Description
|------------------------------------|--------------------|---------|------------------------------------------------------------
| `didChangeFlag.{flag}.{state}`     |                    |         | _published by any widget to communicate a boolean state_
|                                    | `flag`             | string  | the topic through which flag consumer and producers are connected (used in the payload _as well as_ in the event name)
|                                    | `state`            | boolean | the new state for the flag

Because the flag `state` is encoded in the event name as `"true"` or `"false"`, subscribers can use pattern matching to create two different subscriptions.
