
# patches

Module for old-style LaxarJS patches used with the didUpdate event.

## Contents

**Module Members**
- [apply](#apply)
- [create](#create)
- [merge](#merge)

## Module Members
#### <a name="apply"></a>apply( obj, patchMap )
Applies all patches given as mapping from object path to new value. If a path fragment doesn't exist
it is automatically inserted, using an array if the next key would be an integer. If a value is
appended to an array all values in between are set to `null`.

This patch format cannot express all operations. Use `json.applyPatch` instead.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| obj | `Object` |  the object to apply the patches on |
| patchMap | `Object` |  the mapping of paths to new values |

#### <a name="create"></a>create( result, base )
Creates a map of patches that describe the difference between to objects or arrays. Each entry is a
path mapped to the changed value. This map can be applied to another object using `applyPatches`.

Properties that start with '$$' are ignored when creating patches, so that for example the $$hashCode
added by AngularJS ngRepeat is ignored.

This patch format cannot express all operations. Use `json.createPatch` instead.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| result | `Object` |  the resulting object the patch map should establish |
| base | `Object` |  the object used to base the patches upon |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Object` |  the mapping of path to patch-value |

#### <a name="merge"></a>merge( first, second )
Merges two patch maps and returns the result. When properties exist in both patch maps, properties
within the second map overwrite those found within the first one.

This patch format cannot express all operations.
Concatenate `json.createPatch` sequences instead of using this method.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| first | `Object` |  first map to merge |
| second | `Object` |  second map to merge |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Object` |  the result of the merging |
