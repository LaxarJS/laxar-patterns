
# <a id="validation"></a>validation

This module provides helpers for patterns regarding *validateRequest*, *willValidate* and
*didValidate* events.

Validation messages can have one of the following structures:
- A simple i18n html message object (locale to html string mapping).
  It will get a default level of [`#LEVEL_ERROR`](#LEVEL_ERROR).
- A message object as required by the messages widget consisting of an i18n html message object under the
  key *i18nHtmlMessage* and a level under the key *level*.

## Contents

**Module Members**

- [LEVEL_SUCCESS](#LEVEL_SUCCESS)
- [LEVEL_INFO](#LEVEL_INFO)
- [LEVEL_WARNING](#LEVEL_WARNING)
- [LEVEL_ERROR](#LEVEL_ERROR)
- [successEvent()](#successEvent)
- [errorEvent()](#errorEvent)
- [handlerFor()](#handlerFor)

**Types**

- [ValidationHandler](#ValidationHandler)
  - [ValidationHandler.registerResourceFromFeature()](#ValidationHandler.registerResourceFromFeature)
  - [ValidationHandler.registerResource()](#ValidationHandler.registerResource)

## Module Members

#### <a id="LEVEL_SUCCESS"></a>LEVEL_SUCCESS `String`

Constant for the value `"SUCCESS"`, indicating a successful validation outcome.

#### <a id="LEVEL_INFO"></a>LEVEL_INFO `String`

Constant for the value `"INFO"`, indicating a validation outcome with informational messages.

#### <a id="LEVEL_WARNING"></a>LEVEL_WARNING `String`

Constant for the value `"WARNING"`, indicating a validation outcome with warnings.

#### <a id="LEVEL_ERROR"></a>LEVEL_ERROR `String`

Constant for the value `"ERROR"`, indicating an erroneous validation outcome.

#### <a id="successEvent"></a>successEvent( resource, messages )

Creates and returns an event resembling a successful validation result.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| resource | `String` |  name of the validated resource |
| messages... | `Object`, `String`, `Array.<String>`, `Array.<Object>` |  messages associated with the result. They should have the structure as described in the module |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Object` |  the validation event |

#### <a id="errorEvent"></a>errorEvent( resource, messages )

Creates and returns an event resembling the result of a validation with errors.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| resource | `String` |  name of the validated resource |
| messages... | `Object`, `String`, `Array.<String>`, `Array.<Object>` |  messages associated with the result. They should have the structure as described in the module |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Object` |  the validation event |

#### <a id="handlerFor"></a>handlerFor( context, configuration )

Creates and returns a new handler for *validateRequest* events for a given context. It handles sending
of *willValidate* and *didValidate* events, including the output of the given `validator` function.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |
| configuration | `Object` |  a laxarjs configuration, from which to get the default validation error message |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`ValidationHandler`](#ValidationHandler) |  the validation handler instance for the given context |

## Types

### <a id="ValidationHandler"></a>ValidationHandler

#### <a id="ValidationHandler.registerResourceFromFeature"></a>ValidationHandler.registerResourceFromFeature( featurePath, validator, optionalOptions )

Registers a validator for *validateRequest* events for a resource configured under the given feature.
It is assumed that the given feature has a `resource` property with the name of the resource to
validate. If the property is not found, an assertion will fail. If on the other hand the option
`isOptional` is given as `true`, this is ignored and nothing good or bad happens.

Apart from that this function works just like [`#ValidationHandler.registerResource`](#ValidationHandler.registerResource).

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
   .registerResourceFromFeature( 'amount', ( event, meta ) => {
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
| validator | `Function` |  the validator function called upon *validateRequest* event for the given resource |
| _optionalOptions_ | `Object` |  options to use |
| _optionalOptions.isOptional_ | `Boolean` |  if `true` a non-configured feature is simply ignored. Otherwise this results in an error (default is `false`) |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`ValidationHandler`](#ValidationHandler) |  this instance for chaining |

#### <a id="ValidationHandler.registerResource"></a>ValidationHandler.registerResource( resource, validator )

Registers a validator for *validateRequest* events for the given resource.

The validator must be a function, that handles the actual validation necessary for the resource. The
validation result is always signaled through one or more generated error messages or the absence of
these messages. So valid results may be a string, an i18n object, an array of the former, `null` or
an empty array. `null` and an empty array signal a successful validation.

The validator receives the event object for the *validateRequest* event and its according `meta` object.

The way these messages are returned by the validator may be one of two ways, depending on the nature
of the validation:

- if the validation can be handled synchronously, the result should simply be returned directly
- in case the validation is asynchronous, a promise must be returned, which must be resolved with the
  same kind of values as for the synchronous case

If the validator throws an error or the promise is rejected, this is treated as a failed validation.
Since this is due to a programming error, the error or rejection cause will be logged and a
configurable message will instead be send in the *didValidate* event. The message is assumed to be
found in the global configuration at `lib.laxar-patterns.validation.i18nHtmlExceptionMessage` as string
or i18n object. If it cannot be found, an empty string is send as message.

Example:
```js
validation.handlerFor( context, configuration, log, i18n )
   .registerResource( 'theAmount', ( event, meta ) => {
      return context.resources.theAmount > 1000;
   } )
   .registerResource( 'currentUser', ( event, meta ) => {
      return fetchUserValidityRules()
         .then( rules => context.resources.currentUser.meets( rules ) )
         .then( valid => {
            return valid ? null : 'The current user isn\'t valid for some reason. Do something!';
         } );
   } );
```

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| resource | `String` |  the resource to validate |
| validator | `Function` |  the validator function called upon *validateRequest* event for the given resource |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`ValidationHandler`](#ValidationHandler) |  this instance for chaining |
