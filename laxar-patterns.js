/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */

/**
 * Entry point to all laxar patterns APIs.
 * The APIs provided by this module usually work on the `AxContext` object of a widget instance, and help
 * when working with certain common event handling and resource patterns.
 *
 * @module laxar-patterms
 */

import * as actions from './lib/actions';
import * as errors from './lib/errors';
import * as flags from './lib/flags';
import * as i18n from './lib/i18n';
import * as json from './lib/json';
import * as resources from './lib/resources';
import * as validation from './lib/validation';
import * as visibility from './lib/visibility';

export {
   /**
    * The [actions](./lib.actions.md) module.
    * Convenience for *takeActionRequest*, *willTakeAction* and *didTakeAction* events.
    *
    * @type {Object}
    * @name actions
    */
   actions,

   /**
    * The [errors](./lib.errors.md) module.
    * Convenience for *didEncounterError* events.
    *
    * @type {Object}
    * @name errors
    */
   errors,

   /**
    * The [flags](./lib.flags.md) module.
    * Convenience for *didChangeFlag* events.
    *
    * @type {Object}
    * @name flags
    */
   flags,

   /**
    * The [i18n](./lib.i18n.md) module.
    * Convenience for *didChangeLocale* events.
    *
    * @type {Object}
    * @name i18n
    */
   i18n,

   /**
    * The [json](./lib.json.md) module.
    * Helpers for working with rfc-6902 JSON patch data.
    *
    * @type {Object}
    * @name json
    */
   json,

   /**
    * The [resources](./lib.resources.md) module.
    * Convenience for *didReplace* and *didUpdate* events.
    *
    * @type {Object}
    * @name resources
    */
   resources,

   /**
    * The [validation](./lib.validation.md) module.
    * Convenience for *validateRequest*, *willValidate* and *didValidate* events.
    *
    * @type {Object}
    * @name validation
    */
   validation,

   /**
    * The [visibility](./lib.visibility.md) module.
    * Convenience for *changeWidgetVisibilityRequest*, *changeAreaVisibilityRequest* and
    * *didChangeAreaVisibility* events.
    *
    * @type {Object}
    * @name visibility
    */
   visibility
};
