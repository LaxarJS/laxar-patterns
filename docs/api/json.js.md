
# json

This module provides helpers for dealing with patches for JSON structures, specifically regarding
[RFC 6901](https://tools.ietf.org/html/rfc6901) and [RFC 6902](https://tools.ietf.org/html/rfc6902).

## Contents

**Module Members**
- [getPointer](#getPointer)
- [setPointer](#setPointer)
- [pointerToPath](#pointerToPath)
- [pathToPointer](#pathToPointer)
- [applyPatch](#applyPatch)
- [createPatch](#createPatch)

## Module Members
#### <a name="getPointer"></a>getPointer( object, pointer, fallback )
Lookup a nested object using an rfc-6901 JSON pointer.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| _object_ | `Object`, `Array` |  the object in which to lookup an entry |
| pointer | `String` |  a valid JSON pointer conforming to rfc-6901 |
| fallback | `*` |  a value to return if the JSON pointer does not point to any value within the object |

##### Returns
| Type | Description |
| ---- | ----------- |
| `*` |  the value found at the JSON pointer, or the fallback value |

#### <a name="setPointer"></a>setPointer( object, pointer, value )
Set a nested item within a structure using an rfc-6901 JSON pointer. Missing containers along the path
will be created (using ax.object.path). The object is modified in-place.

JSON pointer segments of the type '/-' (for appending to an array) are not supported. You can use a
single JSON patch 'add' operation to achieve the desired effect.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| object | `Object`, `Array` |  the object in which to lookup an entry |
| pointer | `String` |  a valid JSON pointer conforming to rfc-6901 |
| value | `*` |  the value to set at the place indicated by the pointer |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Object`, `Array` |  the modified object (for chaining) |

#### <a name="pointerToPath"></a>pointerToPath( pointer )
Transform an rfc-6901 JSON pointer into a laxar object path.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| pointer | `String` |  a valid JSON pointer conforming to rfc-6901 |

##### Returns
| Type | Description |
| ---- | ----------- |
| `String` |  a path that can be used with ax.object.path |

#### <a name="pathToPointer"></a>pathToPointer( path )
Transform a laxar object path into an rfc-6901 JSON pointer.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| path | `String` |  a LaxarJS object path where segments are separated using '.' |

##### Returns
| Type | Description |
| ---- | ----------- |
| `String` |  a valid JSON pointer conforming to rfc-6901 |

#### <a name="applyPatch"></a>applyPatch( object, patches )
Calls fast-json-patch to apply the given rfc-6902 JSON patch sequence in-place. If the patch sequence
fails to apply, the behavior is undefined.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| object | `Object`, `Array` |  the object to patch (in-place) |
| patches | `Array` |  a sequence of patches as defined by rfc-6902 |

#### <a name="createPatch"></a>createPatch( objectA, objectB )
Calls fast-json-patch to create a rfc-6902 conform JSON patch sequence.

##### Parameters
| Property | Type | Description |
| -------- | ---- | ----------- |
| objectA | `Object`, `Array` |  the first item for comparison |
| objectB | `Object`, `Array` |  the second item for comparison |

##### Returns
| Type | Description |
| ---- | ----------- |
| `Array` |  a sequence of patches as defined by rfc-6902 |
