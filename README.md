# LaxarJS Patterns [![Build Status](https://travis-ci.org/LaxarJS/laxar-patterns.svg?branch=master)](https://travis-ci.org/LaxarJS/laxar-patterns)

> Utilities to implement standard event patterns in LaxarJS widgets

[LaxarJS](https://laxarjs.org) defines the semantics of [core event patterns](https://laxarjs.org/docs/laxar-v2-latest/manuals/events/#core-patterns).
For application-level events, _LaxarJS Patterns_ provides an additional vocabulary, grouped into a handful of _pattern families_.
Also, a helper library is provided, to simplify dealing with event subscriptions.

Have a look at the [docs](docs/index.md) for more information, but  make sure that you are familiar with [LaxarJS](https://laxarjs.org) first.


### Installation

Install laxar-patterns into your LaxarJS project using _npm:_

```console
npm install --save-dev laxar-patterns
```

For efficient usage of the available pattern libraries in your widgets, you should consult the [API docs](docs/api/laxar-patterns) as well.


### Building from Source

Instead of using a pre-compiled library within a project, you can also clone this repository:

```console
git clone https://github.com/LaxarJS/laxar-patterns.git
cd laxar-patterns
npm install
```

To see changes in your application, either configure your project to work with the sources (e.g. by using webpack), or rebuild the webpack bundles by running `npm run dist`.

To run the automated karma tests:

```console
npm test
```

To generate HTML spec runners for opening in your web browser, so that you can e.g. use the browser's developer tools:

```console
npm start
```

Now you can select a spec-runner by browsing to [http://localhost:8080/dist/lib/spec/laxar-patterns.spec.html](http://localhost:8080/dist/lib/spec/laxar-patterns.spec.html)
