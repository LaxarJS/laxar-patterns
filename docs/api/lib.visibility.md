
# <a id="visibility"></a>visibility

This module provides helpers for patterns regarding *changeAreaVisibilityRequest* and
*didChangeAreaVisibility* events.

## Contents

**Module Members**

- [requestPublisherForWidget()](#requestPublisherForWidget)
- [requestPublisherForArea()](#requestPublisherForArea)
- [handlerFor()](#handlerFor)

**Types**

- [VisibilityHandler](#VisibilityHandler)
  - [VisibilityHandler.registerArea()](#VisibilityHandler.registerArea)

## Module Members

#### <a id="requestPublisherForWidget"></a>requestPublisherForWidget( context )

Publishes *changeWidgetVisibilityRequest* events.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Function` |  a function of boolean that requests for widget visibility to be set to the given state |

#### <a id="requestPublisherForArea"></a>requestPublisherForArea( context, area )

Publishes *changeAreaVisibilityRequest* events.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |
| area | `String` |  the name of a widget area whose visibility is to be controlled by the function returned |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Function` |  a function of boolean that requests for the given area's visibility to be set to the given state |

#### <a id="handlerFor"></a>handlerFor( context, optionalOptions )

Creates a new handler instance for *didChangeAreaVisibility* events.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on. The visibility handler will manage the boolean context property `isVisible` which can be used to determine the visibility state of the entire widget |
| _optionalOptions_ | `Object` |  additional options to pass to the visibility handler |
| _optionalOptions.onChange_ | `Function` |  a handler to call when a *didChangeAreaVisibility* request for this widget's container was received, and the visibility of this widget was changed |
| _optionalOptions.onShow_ | `Function` |  a handler to call when a *didChangeAreaVisibility* request for this widget's container was received, and the visibility of this widget was changed to `true` |
| _optionalOptions.onHide_ | `Function` |  a handler to call when a *didChangeAreaVisibility* request for this widget's container was received, and the visibility of this widget was changed to `false` |
| _optionalOptions.onAnyAreaRequest_ | `Function` |  a handler for any `*changeAreaVisibilityRequest* to this widget's areas The handler must<br>- _either_ return `true`/`false` to indicate visibility synchronously<br>- _or_ issue a will/did-response for the area when called |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`VisibilityHandler`](#VisibilityHandler) |  a visibility handler instance |

## Types

### <a id="VisibilityHandler"></a>VisibilityHandler

#### <a id="VisibilityHandler.registerArea"></a>VisibilityHandler.registerArea( areaName, optionalOptions )

Handles *changeAreaVisibilityRequest* events for a specific area, using a callback.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| areaName | `String` |  the name of the area for which to handle visibility events |
| _optionalOptions_ | `Object` |  additional options to pass to the visibility handler |
| _optionalOptions.onRequest_ | `Function` |  a callback for any *changeAreaVisibilityRequest* to this area. The callback may issue a will/did-response for the area when called, or return a boolean which causes the visibility handler to respond accordingly. This should not be used in conjunction with the global `onAnyAreaRequest`-option of the handler |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`VisibilityHandler`](#VisibilityHandler) |  this instance for chaining |
