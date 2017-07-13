
# flags

This module provides helpers for patterns regarding *didChangeFlag* events.

## Contents

**Module Members**
- [handlerFor](#handlerFor)

**Types**
- [FlagHandler](#FlagHandler)
  - [FlagHandler#registerFlagFromFeature](#FlagHandler#registerFlagFromFeature)
  - [FlagHandler#registerFlag](#FlagHandler#registerFlag)

## Module Members
#### <a name="handlerFor"></a>handlerFor( scope )
Creates a new handler instance for didChangeFlag events, on which one can attach a listener for
accumulated flag changes. Assume for example a feature like `disableOn`, which defines a set of flags,
where a `true` state of any of the flags disables the widget. The developer shouldn't care about single
flag states but should only be notified, if a change of one flag leads to a change of the accumulated
"any flag should be true" state.

Additionally it is possible to let the handler set the current state of the accumulated flag on a given
scope property.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| scope | `Object` |  the scope the handler should work with. It is expected to find an `eventBus` property there with which it can do the event handling |

##### Returns
| Type | Description |
| ---- | ----------- |
| `FlagHandler` |  a flag handler instance |

## Types
### <a name="FlagHandler"></a>FlagHandler

#### <a name="FlagHandler#registerFlagFromFeature"></a>FlagHandler#registerFlagFromFeature( featurePath, optionalOptions )
Registers a flag or a set of flags from the given feature. In contrast to the `ResourceHandler` here
the complete attribute path to the flag(s) must be provided. This is due to the fact that there is no
convention on names for flags on a feature, as there can coexist multiple flags for one feature, each
influencing a different aspect of this feature.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| featurePath | `String` |  the attribute path to the configured flag(s) within the feature map |
| _optionalOptions_ | `Object`, `Function` |  options and callbacks to use. If a function is passed, it is used as the `onChange` option. |
| _optionalOptions.initialState_ | `Boolean` |  the optional initial state of the accumulated state. If not given each non-inverted flag is initially assumed to be `false` and `true`, if it is inverted |
| _optionalOptions.onChange_ | `Function`, `Array.<Function>` |  a function or a list of functions to call whenever the accumulated state of the flags changes. It receives the new state as first argument and its previous state as second argument |
| _optionalOptions.scopeKey_ | `String` |  the key to set the current accumulated state on in the scope. If not given, nothing happens. For example `flags.myFlag` would set `scope.flags.myFlag` to the currently valid accumulated state |
| _optionalOptions.predicate_ | `String` |  one of these:<br>- `any`: if any of the flag's states is `true`, the accumulated state is `true`. This is the default<br>- `all`: if all of the flag's states are `true`, the accumulated state is `true` |

##### Returns
| Type | Description |
| ---- | ----------- |
| `FlagHandler` |  this instance for chaining |

#### <a name="FlagHandler#registerFlag"></a>FlagHandler#registerFlag( possibleFlags, optionalOptions )
Registers a flag or a set of flags given as argument. Even `undefined`, `null` or an empty array
are handled gracefully and treated as an empty set of flags, thus never changing their states.

The new accumulated state is set on `scope.flags` if that is defined. Otherwise it is set on
`scope.model`.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| possibleFlags | `String`, `Array.<String>` |  one or a list of flags to watch |
| _optionalOptions_ | `Object`, `Function` |  options and callbacks to use. If a function is passed, it is used as the `onChange` option. |
| _optionalOptions.initialState_ | `Boolean` |  the optional initial state of the accumulated state. If not given each non-inverted flag is initially assumed to be `false` and `true`, if it is inverted |
| _optionalOptions.onChange_ | `Function`, `Array.<Function>` |  a function or a list of functions to call whenever the accumuated state of the flags changes. It receives the new state as first argument and its previous state as second argument |
| _optionalOptions.scopeKey_ | `String` |  the key to set the current accumulated state on in the scope. If not given, nothing happens. For example `flags.myFlag` would set `scope.flags.myFlag` to the currently valid accumulated state |
| _optionalOptions.predicate_ | `String` |  one of these:<br>- `any`: if any of the flag's sates is `true`, the accumulated state is `true`. This is the default<br>- `all`: if all of the flag's states are `true`, the accumulated state is `true` |

##### Returns
| Type | Description |
| ---- | ----------- |
| `FlagHandler` |  this instance for chaining |
