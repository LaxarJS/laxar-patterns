
# validation

This module provides helpers for patterns regarding *validateRequest*, *willValidate* and
*didValidate* events.

Validation messages can have one of the following structures:
- A simple html message object (locale to string mapping). It will get a default level of *ERROR*.
- A html message object as required by the messages widget consisting of a html message object under the
  key *htmlMessage* and a level under the key *level*.

## Contents

**Module Members**
- [successEvent](#successEvent)
- [errorEvent](#errorEvent)
- [handlerFor](#handlerFor)

**Types**
- [ValidationHandler](#ValidationHandler)
  - [ValidationHandler#registerResourceFromFeature](#ValidationHandler#registerResourceFromFeature)
  - [ValidationHandler#registerResource](#ValidationHandler#registerResource)

## Module Members
#### <a name="successEvent"></a>successEvent( resource, htmlMessages )
Creates and returns an event resembling a successful validation result.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| resource | `String` |  name of the validated resource |
| htmlMessages... | `Array.<Object>`, `Object`, `Array.<String>`, `String` |  messages associated with the result. They should have the structure as described in the module |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Object` |  the validation event |

#### <a name="errorEvent"></a>errorEvent( resource, htmlMessages )
Creates and returns an event resembling the result of a validation with errors.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| resource | `String` |  name of the validated resource |
| htmlMessages... | `Array.<Object>`, `Object`, `Array.<String>`, `String` |  messages associated with the result. They should have the structure as described in the module |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Object` |  the validation event |

#### <a name="handlerFor"></a>handlerFor( context )
Creates and returns a new handler for `validateRequest` events for a given context. It handles sending
of `willValidate` and `didValidate` events, including the output of the given `validator` function.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `Object` |  the context the handler should work with. It expects to find an `eventBus` property, with which it can do the event handling |

##### Returns
| Type | Description |
| ---- | ----------- |
| `ValidationHandler` |  the validation handler instance for the given context |

## Types
### <a name="ValidationHandler"></a>ValidationHandler

#### <a name="ValidationHandler#registerResourceFromFeature"></a>ValidationHandler#registerResourceFromFeature( featurePath, validator, optionalOptions )
Registers a validator for `validateRequest` events for a resource configured under the given feature.
It is assumed that the given feature has a `resource` property with the name of the resource to
validate. If the property is not found, an assertion will fail. If on the other hand the option
`isOptional` is given as `true`, this is ignored and nothing good or bad happens.

Apart from that this function works just like [ValidationHandler#registerResource](#ValidationHandler#registerResource).

Example:
Consider the following configuration for a widget:
```json
{
   "features": {
      "amount": {
         "resource": "theAmount"
      }
   }
}
```
An example using that would be:
```js
validation.handlerFor( context )
   .registerResourceFromFeature( 'amount', function( event, meta ) {
      if( isAmountValid() ) {
         return null;
      }
      return 'The given amount is not valid';
   } );
```

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| featurePath | `String` |  the feature to read the resource to validate from |
| validator | `Function` |  the validator function called upon `validateRequest` for the given resource |
| _optionalOptions_ | `Object` |  options to use |
| _optionalOptions.isOptional_ | `Boolean` |  if `true` a non-configured feature is simply ignored. Otherwise this results in an error (default is `false`) |

##### Returns
| Type | Description |
| ---- | ----------- |
| `ValidationHandler` |  this instance for chaining |

#### <a name="ValidationHandler#registerResource"></a>ValidationHandler#registerResource( resource, validator )
Registers a validator for `validateRequest` events for the given resource.

The validator must be a function, that handles the actual validation necessary for the resource. The
validation result is always signaled through one or more generated error messages or the absence of
these messages. So valid results may be a string, an i18n object, an array of the former, `null` or
an empty array. `null` and an empty array signal a successful validation.

The validator receives the event object for the `validateRequest` event and its according `meta` object.

The way these messages are returned by the validator may be one of two ways, depending on the nature
of the validation:

- if the validation can be handled synchronously, the result should simply be returned directly
- in case the validation is asynchronous, a promise must be returned, which must be resolved with the
  same kind of values as for the synchronous case

If the validator throws an error or the promise is rejected, this is treated as a failed validation.
Since this is due to a programming error, the error or rejection cause will be logged and a
configurable message will instead be send in the `didValidate` event. The message is assumed to be
found in the global configuration under the path `lib.laxar-patterns.validation.i18nHtmlExceptionMessage`
as string or i18n object. If it cannot be found, an empty string is send as message.

Example:
```js
validation.handlerFor( context )
   .registerResource( 'theAmount', function( event, meta ) {
      return context.resources.theAmount > 1000;
   } )
   .registerResource( 'currentUser', function( event, meta ) {
      return fetchUserValidityRules()
         .then( function( rules ) {
            return context.resources.currentUser.meets( rules );
         } )
         .then( function( valid ) {
            return valid ? null : 'The current user isn\'t valid for some reason. Do something!';
         } );
   } );
```

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| resource | `String` |  the resource to validate |
| validator | `Function` |  the validator function called upon `validateRequest` for the given resource |

##### Returns
| Type | Description |
| ---- | ----------- |
| `ValidationHandler` |  this instance for chaining |
