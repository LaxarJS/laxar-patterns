
# errors

This module provides helpers for patterns regarding *didEncounterError* events.

## Contents

**Module Members**
- [errorPublisherForFeature](#errorPublisherForFeature)

## Module Members
#### <a name="errorPublisherForFeature"></a>errorPublisherForFeature( scope, featurePath, options )
Creates and returns a function to publish didEncounterError events related to a specific feature.
Generated events will not be delivered to the sender.

The returned publisher function takes these arguments:
- `code`: a generic code that identifies the failing operation (such as 'HTTP_PUT', 'HTTP_GET')
- `messagePath`: to lookup a human-readable message under this publisher's feature configuration
- `data`: additional information to be used for substituting in the message, It should contain the
  fields `resource` and `location` if applicable.
- `cause`: more diagnostic information on the error's cause, such as the underlying HTTP status code

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| scope | `Object` |  the scope the publisher works on |
| featurePath | `String` |  the configuration path for (i18n) error-messages to publish |
| _options_ | `Object` |  an optional object with additional configuration |
| _options.localizer_ | `Function` |  a function such as `i18nHandler.localize` to prepare messages |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Function` |  a publisher function with four arguments as described above |
