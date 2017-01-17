# LaxarJS Patterns [![Build Status](https://travis-ci.org/LaxarJS/laxar-patterns.svg?branch=master)](https://travis-ci.org/LaxarJS/laxar-patterns)

> Utilities to implement standard event patterns in LaxarJS widgets

The LaxarJS Runtime already defines the semantics of [core event patterns](//github.com/LaxarJS/laxar/tree/master/docs/manuals/events.md#core-patterns).
For application-level events, _LaxarJS Patterns_ provides an additional vocabulary, which may be grouped into a handful of _pattern families_.
Also, a helper library is provided, to simplify dealing with event subscriptions.

Have a look at the [docs](docs/index.md) for more information, but  make sure that you are familiar with [LaxarJS](//github.com/LaxarJS/laxar) first.

For efficient usage of the available pattern libraries in your widgets, you should consult the [API docs](docs/api) as well.


### Hacking the library

Instead of using a pre-compiled library within a project, you can also clone this repository:

```sh
git clone https://github.com/LaxarJS/laxar.git
cd laxar
npm install
```

To see changes in your application, either configure your project to work with the sources (e.g. by using webpack), or rebuild the webpack bundles by running `npm run dist`.

To run the automated karma tests:

```sh
npm test
```

To generate HTML spec runners for opening in your web browser, so that you can e.g. use the browser's developer tools:

```sh
npm run browser-spec
```

Now you can select a spec-runner by browsing to http://localhost:8082/spec-output/.
