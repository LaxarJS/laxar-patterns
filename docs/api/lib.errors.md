
# <a id="errors"></a>errors

This module provides helpers for patterns regarding *didEncounterError* events.

## Contents

**Module Members**

- [errorPublisherForFeature()](#errorPublisherForFeature)

## Module Members

#### <a id="errorPublisherForFeature"></a>errorPublisherForFeature( context, featurePath, options )

Creates and returns a function to publish *didEncounterError* events related to a specific feature.
Generated events will not be delivered to the sender.

The returned publisher function takes these arguments:
- `code` (`String`): a generic code that identifies the failing operation (such as `'HTTP_PUT'`,
  `'HTTP_GET'` ...)
- `messagePath` (`String`): path to the message (or i18n message object) located under
  ```context.features.${featurePath}``` to send along with the error event
- `data` (`any`): additional information to be used for substituting in the message. It should contain the
  fields `resource` and `location` if applicable.
- `cause` (`any`): more diagnostic information on the error's cause, such as the underlying HTTP status
  code

Example:

Possible feature configuration:
```json
{
   "features": {
      "myFeatures": {
         "failureMessage": "Something really bad happened!"
      }
   }
}
```
Creating and using a publisher:
```js
const publisher = errors.errorPublisherForFeature( context, 'myFeature' );
// ...
publisher( 'HTTP_GET', 'failureMessage', {
   resource: 'user',
   moreInfo: 'Probably under DoS attack'
} );
```

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |
| featurePath | `String` |  the configuration path for (i18n) error-messages to publish |
| _options_ | `Object` |  an optional object with additional configuration |
| _options.localizer_ | `Function` |  a function such as `i18nHandler.localize` to prepare messages |
| _options.formatter_ | `Function` |  a `laxar.string.format`-compatible function to interpolate message arguments |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Function` |  a publisher function with four arguments as described above |
