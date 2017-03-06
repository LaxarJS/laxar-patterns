
# <a id="flags"></a>flags

This module provides helpers for patterns regarding *didChangeFlag* events.

## Contents

**Module Members**

- [PREDICATE_ANY](#PREDICATE_ANY)
- [PREDICATE_ALL](#PREDICATE_ALL)
- [publisherForFeature()](#publisherForFeature)
- [publisher()](#publisher)
- [handlerFor()](#handlerFor)

**Types**

- [FlagHandler](#FlagHandler)
  - [FlagHandler.registerFlagFromFeature()](#FlagHandler.registerFlagFromFeature)
  - [FlagHandler.registerFlag()](#FlagHandler.registerFlag)

## Module Members

#### <a id="PREDICATE_ANY"></a>PREDICATE_ANY `String`

Constant for the value `"any"`. If this is used as argument to `registerFlag` or `registerFlagFromFeature`,
any flag state being `true` during evaluation, yields to an overall outcome of `true`

#### <a id="PREDICATE_ALL"></a>PREDICATE_ALL `String`

Constant for the value `"all"`. If this is used as argument to `registerFlag` or `registerFlagFromFeature`,
any flag state being `false` during evaluation, yields to an overall outcome of `false`.

#### <a id="publisherForFeature"></a>publisherForFeature( context, featurePath, optionalOptions )

Creates a publisher for the state of a flag, where the name of the flag is configured as widget feature.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |
| featurePath | `String` |  the attribute path to the configured flag within the feature map |
| _optionalOptions_ | `Object` |  options for the publisher |
| _optionalOptions.optional_ | `Boolean` |  if `true`, a missing feature configuration will result in a noop publisher. Else, a missing feature configuration results in a thrown error. Default is `false` |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Function` |  the state publisher function, expecting only the new state of the flag as `boolean` value |

#### <a id="publisher"></a>publisher( context, flagName )

Creates a publisher for the state of a flag, whose name is directly provided as argument.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |
| flagName | `String` |  the name of the flag |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Function` |  the state publisher function, expecting only the new state of the flag as `boolean` value |

#### <a id="handlerFor"></a>handlerFor( context )

Creates a new handler instance for *didChangeFlag* events, on which one can attach a listener for
accumulated flag changes. Assume for example a feature like `disableOn`, which defines a set of flags,
where a `true` state of any of the flags disables the widget. The developer shouldn't care about single
flag states but should only be notified, if a change of one flag leads to a change of the accumulated
"any flag should be true" state.

Additionally it is possible to let the handler set the current state of the accumulated flag on a given
context property.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`FlagHandler`](#FlagHandler) |  a flag handler instance |

## Types

### <a id="FlagHandler"></a>FlagHandler

#### <a id="FlagHandler.registerFlagFromFeature"></a>FlagHandler.registerFlagFromFeature( featurePath, optionalOptions )

Registers a flag or a set of flags from the given feature. In contrast to e.g. a `ResourceHandler`, here
the complete attribute path to the flag(s) must be provided. This is due to the fact that there is no
convention on names for flags on a feature, as there can coexist multiple flags for one feature, each
influencing a different aspect of this feature.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| featurePath | `String` |  the attribute path to the configured flag(s) within the feature map |
| _optionalOptions_ | `Object`, `Function` |  options and callbacks to use. If a function is passed, it is used as the `onChange` option. |
| _optionalOptions.initialState_ | `Boolean` |  the optional initial state of the accumulated state. If not given, each non-inverted flag is initially assumed to be `false`, and `true`, if it is inverted |
| _optionalOptions.onChange_ | `Function`, `Array.<Function>` |  a function or a list of functions to call whenever the accumulated state of the flags changes. It receives the new state as first argument and its previous state as second argument |
| _optionalOptions.contextKey_ | `String` |  the key to set the current accumulated state on in the context. If not given, nothing happens. For example `flags.myFlag` would set `context.flags.myFlag` to the currently valid accumulated state |
| _optionalOptions.predicate_ | `String` |  either [`#PREDICATE_ANY`](#PREDICATE_ANY) (default) or [`#PREDICATE_ALL`](#PREDICATE_ALL) |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`FlagHandler`](#FlagHandler) |  this instance for chaining |

#### <a id="FlagHandler.registerFlag"></a>FlagHandler.registerFlag( possibleFlags, optionalOptions )

Registers a flag or a set of flags given as argument. Even `undefined`, `null` or an empty array
are handled gracefully and treated as an empty set of flags, thus never changing their states.

The new accumulated state is set on `context.flags` if that is defined. Otherwise it is set on
`context.model`.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| possibleFlags | `String`, `Array.<String>` |  one or a list of flags to watch |
| _optionalOptions_ | `Object`, `Function` |  options and callbacks to use. If a function is passed, it is used as the `onChange` option. |
| _optionalOptions.initialState_ | `Boolean` |  the optional initial state of the accumulated state. If not given each non-inverted flag is initially assumed to be `false` and `true`, if it is inverted |
| _optionalOptions.onChange_ | `Function`, `Array.<Function>` |  a function or a list of functions to call whenever the accumuated state of the flags changes. It receives the new state as first argument and its previous state as second argument |
| _optionalOptions.contextKey_ | `String` |  the key to set the current accumulated state on in the context. If not given, nothing happens. For example `flags.myFlag` would set `context.flags.myFlag` to the currently valid accumulated state |
| _optionalOptions.predicate_ | `String` |  either [`#PREDICATE_ANY`](#PREDICATE_ANY) (default) or [`#PREDICATE_ALL`](#PREDICATE_ALL) |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`FlagHandler`](#FlagHandler) |  this instance for chaining |
