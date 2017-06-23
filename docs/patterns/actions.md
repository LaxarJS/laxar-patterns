[« return to the patterns overview](../index.md)

# Action Patterns

In LaxarJS applications, _actions_ allow widgets and activities to give their collaborators the opportunity to _react_ to "something that happened".
Usually, "something" is a user-interaction: A confirmation button was clicked, a selection was changed or a backend call was completed on behalf of the user.

Other widgets may respond to arbitrary action requests by listening to their configured topics, and taking an action _appropriate for them:_
They might open a popup, start navigation, perform a HTTP request, ask to validate or save some resources, clear their own resources and so on.
When widgets respond to an action request, they can do so _asynchronously_ using the [will/did]-mechanism.
This means that actions can have a _duration_, which is useful for longer running tasks such as performing a search.
The duration can in turn be used by yet other widgets, for example to show a progress indicator every time that an action on the page runs for more than, say, 200 milliseconds.

If you are familiar with _[Qt's signal/slot](http://qt-project.org/doc/qt-5/signalsandslots.html)_ mechanism, you may think of an action as the named, asynchronous counterpart to an _n:m_ signal/slot connection.


## Action Requests and Will/Did-Responses

As with [resources](./resources.md), the _page configuration_ determines which widgets share action topics:
If a widget offers to publish an action, but no topic was configured for that action, it should not publish an event.
Similarly, if a widget offers to respond to some action, but no topic was configured, it should not subscribe to action requests.


### The _takeActionRequest, willTakeAction_ and _didTakeAction_ Events

A widget (the _action initiator_) may request for action to be taken by publishing a `takeActionRequest`.
Collaborators (_action handlers_) capable and configured to perform a corresponding action respond by publishing a `willTakeAction` event.
After they have completed performing their action, possibly asynchronously, the collaborators publish a `didTakeAction` event.

| Event name                         | Payload Attribute  | Type   | Description
|------------------------------------|--------------------|--------|------------------------------------------------------------
| `takeActionRequest.{action}`       |                    |        | _published by any widget to request for some action being taken_
|                                    | `action`           | string | the topic through which respondents are connected (used in the payload _as well as_ in the event name)
|                                    | `anchorDomElement` | string | If applicable: the ID of a DOM element where the action originated
| `willTakeAction.{action}`          |                    |        | _published by a widget that is about to perform some action_
|                                    | `action`           | string | _see above_
| `didTakeAction.{action}.{outcome}` |                    |        | _published by a widget that has completed its action_
|                                    | `action`           | string | _see above_
|                                    | `outcome`          | string | `ERROR` or `SUCCESS` (used in the payload _as well as_ in the event name)

The `anchorDomElement` that can be sent along with the `takeActionRequest ` is useful to display popover hints right next to the UI element that was activated by the user.
This information exposes implementation details of the sender, so respondents should take care not to modify the sender DOM and not to rely on a specific structure.

The `outcome` that is sent with the `didTakeAction` response indicated if the (assumed) user intent could be satisfied, because of an error condition that could not be handled (such as a network problem).
If the outcome is `ERROR`, the initiator should signal this to the user if appropriate, and the handler should publish a `didEncounterError` event with details on the problem.

Although any additional information to a `takeActionRequest` or `didTakeAction` event payload may not be understood by a random third party widget, it may be part of a unidirectional data flow.
For this paradigm it is important, that for any resource only one source exists, that is allowed to replace this resource completely or update parts of it by means of [resource replace and update mechanisms](./resources.md).
Any other widget collaborating on the same resource may change this resource locally, but is not allowed to publish any updates to it directly or even replace it.
Instead such a widget will send a `takeActionRequest` event with the changes it would like to see for a certain resource as additional payload, ideally as functional request instead of the changes already incorporated into the resource.
The actual change can then be achieved directly by the activity being the master for the resource or by means of e.g. a REST request.
