# Changelog

## Last Changes

- [#30](https://github.com/LaxarJS/laxar_patterns/issues/30): resources: allow paths for `isSame` comparison
- [#28](https://github.com/LaxarJS/laxar_patterns/issues/28): visibility: use publishAndGatherReplies in request publishers


## v0.18.0

- [#26](https://github.com/LaxarJS/laxar_patterns/issues/26): documentation: overview, resource/action/flag/error patterns
- [#24](https://github.com/LaxarJS/laxar_patterns/issues/24): refactoring: use `laxar.string` rather than `laxar.text`


## v0.17.0

- [#23](https://github.com/LaxarJS/laxar_patterns/issues/23): actions: added promise support for asynchronous handlers.


## v0.16.0

- [#22](https://github.com/LaxarJS/laxar_patterns/issues/22): actions: implemented action handler and publisher convenience.
  NEW FEATURE: see ticket for details


## v0.15.0

- [#21](https://github.com/LaxarJS/laxar_patterns/issues/21): resources: added deliverToSender option to event publishers.
- [#20](https://github.com/LaxarJS/laxar_patterns/issues/20): fixed wrongly global assert in jshintrc.


## v0.14.0

- [#19](https://github.com/LaxarJS/laxar_patterns/issues/19): tests: make sure PhantomJS is installed properly, before running spec tests.
- [#18](https://github.com/LaxarJS/laxar_patterns/issues/18): added support for visibility events
  NEW FEATURE: see ticket for details


## v0.13.0

- [#17](https://github.com/LaxarJS/laxar_patterns/issues/17): replace and update publishers now return a promise.
- [#16](https://github.com/LaxarJS/laxar_patterns/issues/16): don't try to load `widget.json` in laxar_patterns specs.
- [#15](https://github.com/LaxarJS/laxar_patterns/issues/15): json: added helpers to work with json pointer (rfc-6901) and json patch (rfc-6902)
- [#14](https://github.com/LaxarJS/laxar_patterns/issues/14): temporarily switched to the LaxarJS fork of json patch.


## v0.12.0

- [#12](https://github.com/LaxarJS/laxar_patterns/issues/12): added support for JSON patch in didUpdate events.
  NEW FEATURE: see ticket for details
- [#13](https://github.com/LaxarJS/laxar_patterns/issues/13): Remove some obsolete NPM `devDependencies`.
- [#11](https://github.com/LaxarJS/laxar_patterns/issues/11): added missing require path mapping for jjv and jjve.


## v0.11.0

- [#8](https://github.com/LaxarJS/laxar_patterns/issues/8): resources: added method `wereAllReplaced` to find out if all registered resources have been replaced
  NEW FEATURE: see ticket for details
- [#10](https://github.com/LaxarJS/laxar_patterns/issues/10): errors: implemented publisher for the didEncounterError event
  NEW FEATURE: see ticket for details
- [#7](https://github.com/LaxarJS/laxar_patterns/issues/7): resources: fixed null-pointer when handling `isOptional`
- [#6](https://github.com/LaxarJS/laxar_patterns/issues/6): i18n: fixed localize to not use fallback for non-i18n values.
- [#9](https://github.com/LaxarJS/laxar_patterns/issues/9): jshintrc: disabled enforcement of dot notation for object property access.
- [#5](https://github.com/LaxarJS/laxar_patterns/issues/5): Fixed jshint violation


## v0.10.0

- [#4](https://github.com/LaxarJS/laxar_patterns/issues/4): Allowed to keep receiving updates from `whenAllWereReplaced` after initial replacement (set watch option to true).
- [#2](https://github.com/LaxarJS/laxar_patterns/issues/2): Gracefully handle optional resources, fixed resource spec tests.
- [#3](https://github.com/LaxarJS/laxar_patterns/issues/3): `patches.create`: exclude properties starting with `$$`.
- [#1](https://github.com/LaxarJS/laxar_patterns/issues/1): Update Bower from ~1.2.8 to ~1.3.3.
