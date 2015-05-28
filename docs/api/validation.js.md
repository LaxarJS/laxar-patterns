
# validation

This module provides helpers for creating event objects to be used with *didValidate* events.

Validation messages can have one of the following structures:
- A simple html message object (locale to string mapping). It will get a default level of *ERROR*.
- A html message object as required by the messages widget consisting of a html message object under the
  key *htmlMessage* and a level under the key *level*.

## Contents

**Module Members**
- [successEvent](#successEvent)
- [errorEvent](#errorEvent)

## Module Members
#### <a name="successEvent"></a>successEvent( resource, htmlMessages )
Creates and returns an event resembling a successful validation result.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| resource | `String` | name of the validated resource |
| htmlMessages... | `Array.<Object>`, `Object` | messages associated with the result. They should have the structure as described in the module |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Object` | the validation event |

#### <a name="errorEvent"></a>errorEvent( resource, htmlMessages )
Creates and returns an event resembling the result of a validation with errors.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| resource | `String` | name of the validated resource |
| htmlMessages... | `Array.<Object>`, `Object` | messages associated with the result. They should have the structure as described in the module |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Object` | the validation event |
