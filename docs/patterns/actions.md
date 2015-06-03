[« return to the patterns overview](../index.md)

# Action Patterns

In LaxarJS applications, _actions_ allow widgets and activities to give their collaborators the opportunity to _react_ to "something that happened".
Usually, "something" is a user-interaction: A confirmation button was clicked, a selection was changed or a service call was completed on behalf of the user.

Other widgets may respond to arbitrary action requests by listening to their configured topics, and taking an action _appropriate for them:_
They might open a popup, start navigation, perform a REST call, ask to validate or save some resources, clear their own resources and so on.
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

Event name                         | Payload Attribute  | Type   | Description
-----------------------------------|--------------------|--------|------------------------------------------------------------
`takeActionRequest.{action}`       |                    |        | _published by any widget to request for some action being taken_
                                   | `action`           | string | the topic through which respondents are connected (used in the payload _as well as_ in the event name)
                                   | `anchorDomElement` | string | If applicable: the ID of a DOM element where the action originated
`willTakeAction.{action}`          |                    |        | _published by a widget that is about to perform some action_
                                   | `action`           | string | _see above_
`didTakeAction.{action}.{outcome}` |                    |        | _published by a widget that has completed its action_
                                   | `action`           | string | _see above_
                                   | `outcome`          | string | `ERROR` or `SUCCESS`

The `anchorDomElement` that can be sent along with the `takeActionRequest ` is useful to display popover hints right next to the UI element that was activated by the user.
This information exposes implementation details of the sender, so respondents should take care not to modify the sender DOM and not to rely on a specific structure.

The `outcome` that is sent with the `didTakeAction` response indicated if the (assumed) user intent could be satisfied, because of an error condition that could not be handled (such as a network problem).
If the outcome is `ERROR`, the initiator should signal this to the user if appropriate, and the handler should publish a `didEncounterError` event with details on the problem.

You are free to add any additional information to a `takeActionRequest` or `didTakeAction` event payload, but bear in mind, that a third party widget following this guide may not understand or preserve your custom data.
