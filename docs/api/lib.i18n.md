
# <a id="i18n"></a>i18n

This module provides helpers for patterns regarding *didChangeLocale* events.

## Contents

**Module Members**

- [handlerFor()](#handlerFor)

**Types**

- [I18nHandler](#I18nHandler)
  - [I18nHandler.registerLocale()](#I18nHandler.registerLocale)
  - [I18nHandler.registerLocaleFromFeature()](#I18nHandler.registerLocaleFromFeature)

## Module Members

#### <a id="handlerFor"></a>handlerFor( context, i18n, optionalI18nPath )

Obtain a handler which applies *didChangeLocale*-events to the given context.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| context | `AxContext` |  the widget context to work on |
| i18n | `Object` |  a laxarjs i18n service instance |
| _optionalI18nPath_ | `String` |  an optional path within the context (default: `'i18n'`) where to store i18n-state |

##### Returns

| Type | Description |
| ---- | ----------- |
| [`I18nHandler`](#I18nHandler) |  a handler which manages the i18n-object on the context, and which allows to register for locale changes, by topic or by feature |

## Types

### <a id="I18nHandler"></a>I18nHandler

#### <a id="I18nHandler.registerLocale"></a>I18nHandler.registerLocale( possibleLocales, optionalOptions )

Manages changes to the given locale(s).

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| possibleLocales | `String`, `Array.<String>` |  zero, one or more locale topics to manage |
| _optionalOptions_ | `Object` |  an optional configuration object |
| _optionalOptions.onChange_ | `Function`, `Array.<Function>` |  a function or a list of functions to call whenever one of the locales changes. It receives the event which triggered the change as the first argument, and the previous language-tag as the second argument |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Object` |  this instance for chaining |

#### <a id="I18nHandler.registerLocaleFromFeature"></a>I18nHandler.registerLocaleFromFeature( featurePath, optionalOptions )

Looks for the given feature path within the feature configuration and registers for changes to the
corresponding locale. If there is a key `locale` at the given feature, that entry is used.
Otherwise, the entire configuration path has to be specified.

##### Parameters

| Property | Type | Description |
| -------- | ---- | ----------- |
| featurePath | `String` |  a feature path for the current context |
| _optionalOptions_ | `Object` |  an optional configuration object |

##### Returns

| Type | Description |
| ---- | ----------- |
| `Object` |  this instance for chaining |
