
# visibility

This module provides helpers for patterns regarding *changeAreaVisibilityRequest* and
*didChangeAreaVisibility* events.

## Contents

**Module Members**
- [handlerFor](#handlerFor)
- [requestPublisherForWidget](#requestPublisherForWidget)
- [requestPublisherForArea](#requestPublisherForArea)

**Types**
- [VisibilityHandler](#VisibilityHandler)
  - [VisibilityHandler#registerArea](#VisibilityHandler#registerArea)

## Module Members
#### <a name="handlerFor"></a>handlerFor( scope, optionalOptions )
Creates a new handler instance for `didChangeAreaVisibility` events.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| scope | `Object` |  the scope the handler should work with. It is expected to find an `eventBus` property there with which it can do the event handling. The visibility handler will manage the boolean scope property `isVisible` which can be used to determine the visibility state of the entire widget |
| _optionalOptions_ | `Object` |  additional options to pass to the visibility handler |
| _optionalOptions.onChange_ | `Function` |  a handler to call when a `didChangeAreaVisibility` request for this widget's container was received, and the visibility of this widget was changed |
| _optionalOptions.onShow_ | `Function` |  a handler to call when a `didChangeAreaVisibility` request for this widget's container was received, and the visibility of this widget was changed to `true` |
| _optionalOptions.onHide_ | `Function` |  a handler to call when a `didChangeAreaVisibility` request for this widget's container was received, and the visibility of this widget was changed to `false` |
| _optionalOptions.onAnyAreaRequest_ | `Function` |  a handler for any `changeAreaVisibilityRequest` to this widget's areas The handler must<br>* _either_ return `true`/`false` to indicate visibility synchronously<br>* _or_ issue a will/did-response for the area when called |

##### Returns
| Type | Description |
| ---- | ----------- |
| `VisibilityHandler` |  a visibility handler instance |

#### <a name="requestPublisherForWidget"></a>requestPublisherForWidget( scope )
Publishes `changeWidgetVisibilityRequest` events.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| scope | `Object` |  a scope (with `widget` and `eventBus` properties) |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Function` |  a function of boolean that requests for widget visibility to be set to the given state |

#### <a name="requestPublisherForArea"></a>requestPublisherForArea( scope, area )
Publishes `changeAreaVisibilityRequest` events.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| scope | `Object` |  a scope (with an `eventBus` property) |
| area | `String` |  the name of a widget area whose visibility is to be controlled by the function returned |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Function` |  a function of boolean that requests for the given area's visibility to be set to the given state |

## Types
### <a name="VisibilityHandler"></a>VisibilityHandler

#### <a name="VisibilityHandler#registerArea"></a>VisibilityHandler#registerArea( areaName, optionalOptions )
Handle change-visibility-requests for a specific area, using a callback.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| areaName | `String` |  the name of the area for which to handle visibility events |
| _optionalOptions_ | `Object` |  additional options to pass to the visibility handler |
| _optionalOptions.onRequest_ | `Function` |  a callback for any `changeAreaVisibilityRequest` to this area. The callback may issue a will/did-response for the area when called, or return a boolean which causes the visibility handler to respond accordingly. This should not be used in conjunction with the global `onAnyAreaRequest`-option of the handler |

##### Returns
| Type | Description |
| ---- | ----------- |
| `VisibilityHandler` |  this instance for chaining |
