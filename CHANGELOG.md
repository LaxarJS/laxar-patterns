# Changelog

## Last Changes

## v0.11.1
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
