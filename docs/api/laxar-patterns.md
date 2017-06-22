
# <a id="laxar-patterns"></a>laxar-patterns

Entry point to all laxar patterns APIs.
The APIs provided by this module usually work on the `AxContext` object of a widget instance, and help
when working with certain common event handling and resource patterns.

## Contents

**Module Members**

- [actions](#actions)
- [errors](#errors)
- [flags](#flags)
- [i18n](#i18n)
- [json](#json)
- [resources](#resources)
- [validation](#validation)
- [visibility](#visibility)

## Module Members

#### <a id="actions"></a>actions `Object`

The [actions](./lib.actions.md) module.
Convenience for *takeActionRequest*, *willTakeAction* and *didTakeAction* events.

#### <a id="errors"></a>errors `Object`

The [errors](./lib.errors.md) module.
Convenience for *didEncounterError* events.

#### <a id="flags"></a>flags `Object`

The [flags](./lib.flags.md) module.
Convenience for *didChangeFlag* events.

#### <a id="i18n"></a>i18n `Object`

The [i18n](./lib.i18n.md) module.
Convenience for *didChangeLocale* events.

#### <a id="json"></a>json `Object`

The [json](./lib.json.md) module.
Helpers for working with rfc-6902 JSON patch data.

#### <a id="resources"></a>resources `Object`

The [resources](./lib.resources.md) module.
Convenience for *didReplace* and *didUpdate* events.

#### <a id="validation"></a>validation `Object`

The [validation](./lib.validation.md) module.
Convenience for *validateRequest*, *willValidate* and *didValidate* events.

#### <a id="visibility"></a>visibility `Object`

The [visibility](./lib.visibility.md) module.
Convenience for *changeWidgetVisibilityRequest*, *changeAreaVisibilityRequest* and
*didChangeAreaVisibility* events.
