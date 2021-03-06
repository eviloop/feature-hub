# Feature Hub

[![Build Status](https://travis-ci.com/sinnerschrader/feature-hub.svg?branch=master)](https://travis-ci.com/sinnerschrader/feature-hub)

The Feature Hub is an [opinionated](#our-requirements-for-micro-frontends)
JavaScript implementation of the
[micro frontends](#micro-frontends-instead-of-monoliths) approach to building
modern web applications with multiple teams and different technologies.

This monorepo contains a [collection of packages](#monorepo-packages) that can
be used together as a full-fledged solution for composing micro frontends. It
supports React micro frontends as first-class citizens, but also allows the
integration of micro frontends that are built with any other frontend technology
(e.g. Vue.js, Angular, Web Components).

In fact, the [`@feature-hub/core`][core-pkg] package is totally independent of
React. It could be used to build an end-to-end solution with any other frontend
technology.

**This software is in active development and is subject to potentially breaking
changes. It is not yet used in production. The currently planned milestones can
be viewed [here](https://github.com/sinnerschrader/feature-hub/milestones).**

## Table of Contents

- [Feature Hub](#feature-hub)
  - [Table of Contents](#table-of-contents)
  - [Motivation](#motivation)
    - [Micro Frontends Instead of Monoliths](#micro-frontends-instead-of-monoliths)
    - [Our Requirements for Micro Frontends](#our-requirements-for-micro-frontends)
    - [Feature Apps & Feature Services](#feature-apps--feature-services)
  - [Monorepo Packages](#monorepo-packages)
  - [Using the Feature Hub](#using-the-feature-hub)
    - [Integrating the Feature Hub](#integrating-the-feature-hub)
      - [The React Feature App Loader](#the-react-feature-app-loader)
      - [The React Feature App Container](#the-react-feature-app-container)
      - [Providing Externals](#providing-externals)
    - [Writing a Feature App](#writing-a-feature-app)
      - [Feature App ID](#feature-app-id)
      - [Feature App Dependencies](#feature-app-dependencies)
      - [Feature App Instantiation](#feature-app-instantiation)
      - [Registering Feature Services](#registering-feature-services)
      - [Using Externals](#using-externals)
    - [Writing a Feature Service](#writing-a-feature-service)
      - [Feature Service ID & Dependencies](#feature-service-id--dependencies)
      - [Feature Service Instantiation & Programmatic Versioning](#feature-service-instantiation--programmatic-versioning)
      - [Feature Service Definition](#feature-service-definition)
      - [Feature Service Binding](#feature-service-binding)
  - [Contributing to the Feature Hub](#contributing-to-the-feature-hub)
    - [Code of Conduct](#code-of-conduct)
    - [Development Scripts](#development-scripts)
    - [Publishing a New Release](#publishing-a-new-release)

## Motivation

The Feature Hub has been created by [SinnerSchrader](https://sinnerschrader.com)
as part of our client work. In order to facilitate collaboration and
reusability, we decided to publish the core functionality of our micro frontend
solution as open source.

### Micro Frontends Instead of Monoliths

> We've seen many teams create front-end **monoliths** — a single, large and
> sprawling browser application — on top of their back-end services. Our
> preferred (and proven) approach is to split the browser-based code into
> **micro frontends**. In this approach, the web application is broken down into
> its features, and each feature is owned, frontend to backend, by a different
> team. This ensures that every feature is developed, tested and deployed
> independently from other features. —
> [thoughtworks.com](https://www.thoughtworks.com/de/radar/techniques/micro-frontends)

### Our Requirements for Micro Frontends

The Feature Hub was designed with the following specific requirements in mind:

- Multiple teams with different technologies and knowledge should be able to
  own, develop, and deploy composable features independently.
- Multiple micro frontends need a way to safely interact with singleton browser
  APIs like the URL/history or localStorage.
- Micro frontends must be able to share state to facilitate a consistent UX.
  - Examples for features needing shared state are: a manager for ensuring only
    one modal is open at a time, or multiple micro frontends that display
    information about the same product selected in one of the micro frontends.
- For SEO purposes, and to operate existing fat client frontend apps which need
  to fetch great amounts of data on boot, server-side rendering must be
  supported.
  - Because of asynchronous data fetching and shared state changes, the
    server-side rendering engine needs to be able to determine the point in time
    at which it can send the fully rendered UI and its corresponding state to
    the client.
  - The server-side rendered UI and its corresponding state must be hydrated on
    the client without visual impact.
- Micro frontends that are incompatible with the integration environment should
  fail early, and not just when the user interacts with the specific
  incompatible feature.
- The composition environment for micro frontends should be flexible. Not only
  preprogrammed templates in a Node.js app, but also integrations from CMS
  environments where authors compose pages should be possible.

In this implementation, a micro frontend is referred to as a **Feature App**.

### Feature Apps & Feature Services

A Feature App encapsulates a composable and reusable UI feature. It may have the
need to share state with other Feature Apps.

A Feature Service provides shared state and functionality to consumers, e.g.
Feature Apps, on the Feature Hub. While simple code sharing should be achieved
by creating libraries, there are features that can only, or more easily, be
achieved by creating Feature Services:

- Share state across consumers.
- Safe access to browser APIs and resources (e.g. URL).
- Automatically scope API usage by consumer (e.g. logging).
- Share configuration across consumers, but only maintain it once.

## Monorepo Packages

| Package                                             | Version                                                          | Description                                        | API                       |
| --------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- | ------------------------- |
| [@feature-hub/core][core-pkg]                       | [![Package Version][core-badge]][core-npm]                       | The core functionality of the Feature Hub.         | [📖][core-api]            |
| [@feature-hub/react][react-pkg]                     | [![Package Version][react-badge]][react-npm]                     | A Feature Hub integrator for React.                | [📖][react-api]           |
| [@feature-hub/module-loader][module-loader-pkg]     | [![Package Version][module-loader-badge]][module-loader-npm]     | A universal module loader.                         | [📖][module-loader-api]   |
| [@feature-hub/server-renderer][server-renderer-pkg] | [![Package Version][server-renderer-badge]][server-renderer-npm] | A Feature Service to manage server-side rendering. | [📖][server-renderer-api] |

## Using the Feature Hub

There are three different roles in a Feature Hub environment:

1.  An **integrator** instantiates the Feature Hub components and provides the
    Feature App compositions.
2.  A **provider** provides a Feature Service to consumers through the feature
    service registry. Most providers are registered by the integrator but they
    can also be registered by Feature Apps.
3.  A **consumer** is everyone who consumes Feature Services. This can be a
    Feature App, other Feature Services, or even the integrator.

### Integrating the Feature Hub

The [`@feature-hub/core`][core-pkg] package provides the following two major
building blocks:

- The `FeatureServiceRegistry`: A class for providing Feature Services to
  dependent consumers.
- The `FeatureAppManager`: A class for managing the lifecycle of Feature Apps.

There are a few steps an integrator needs to follow to compose a web page of
multiple Feature Apps that share state through Feature Services:

1.  Gather consumer configs (for Feature Apps and Feature Services).
1.  Instantiate a `FeatureServiceRegistry` (with consumer configs).
1.  Register a set of Feature Services at the registry.
1.  Create a `FeatureAppManager` singleton instance with the registry and a
    browser or Node.js module loader.

A typical integrator bootstrap code would look like this:

```js
import {FeatureAppManager, FeatureServiceRegistry} from '@feature-hub/core';
import {loadCommonJsModule} from '@feature-hub/module-loader/node';

const configs = {}; // import configs from somewhere
const registry = new FeatureServiceRegistry(configs);

const featureServiceDefinitions = [
  sampleFeatureServiceDefinition1, // import definitions from somewhere
  sampleFeatureServiceDefinition2
];

registry.registerProviders(featureServiceDefinitions, 'integrator');

const manager = new FeatureAppManager(registry, loadCommonJsModule);
```

A React integrator can then use the `FeatureAppLoader` or the
`FeatureAppContainer` (both from the `@feature-hub/react` package) to place
Feature Apps onto the web page. Each of them need the `FeatureAppManager`
singleton instance to render their Feature App.

#### The React Feature App Loader

With the React `FeatureAppLoader` a Feature App can be loaded and rendered by
defining a `src` which is the URL to its JavaScript UMD bundle, e.g.:

```js
import {FeatureAppLoader} from '@feature-hub/react';
```

```jsx
<FeatureAppLoader
  manager={manager}
  src="https://example.com/my-feature-app.js"
/>
```

Additionally, when a Feature App wants to be rendered on the server, its
`nodeSrc` must be specified, which is the URL to its CommonJS bundle (targeted
at Node.js):

```jsx
<FeatureAppLoader
  manager={manager}
  src="https://example.com/my-feature-app.js"
  nodeSrc="https://example.com/my-feature-app-node.js"
/>
```

**Note:** Server-side rendering of Feature Apps is not fully supported yet. See
our [roadmap](https://github.com/sinnerschrader/feature-hub/milestone/3) for
details.

You can also define a `css` prop to add stylesheets to the document.

```jsx
<FeatureAppLoader
  manager={manager}
  src="https://example.com/my-feature-app.js"
  css={[
    {href: 'https://example.com/my-feature-app.css'},
    {href: 'https://example.com/my-feature-app-print.css', media: 'print'}
  ]}
/>
```

If multiple instances of the same Feature App must be placed onto a single page,
a `featureAppKey` that is unique for the Feature App `id` must be defined by the
integrator, e.g.:

```jsx
<section>
  <div>
    <FeatureAppLoader
      manager={manager}
      src="https://example.com/my-feature-app.js"
      featureAppKey="main"
    />
  </div>
  <aside>
    <FeatureAppLoader
      manager={manager}
      src="https://example.com/my-feature-app.js"
      featureAppKey="aside"
    />
  </aside>
</section>
```

#### The React Feature App Container

With the React `FeatureAppContainer` a Feature App can be rendered by directly
providing its Feature App definition:

```js
import {FeatureAppContainer} from '@feature-hub/react';
import {myFeatureAppDefinition} from './my-feature-app';
```

```jsx
<FeatureAppContainer
  manager={manager}
  featureAppDefinition={myFeatureAppDefinition}
/>
```

This allows the integrator to bundle Feature Apps, instead of loading them from
a remote location.

If multiple instances of the same Feature App must be placed onto a single page,
a `featureAppKey` that is unique for the Feature App `id` must be defined by the
integrator, e.g.:

```jsx
<section>
  <div>
    <FeatureAppContainer
      manager={manager}
      featureAppDefinition={myFeatureAppDefinition}
      featureAppKey="main"
    />
  </div>
  <aside>
    <FeatureAppContainer
      manager={manager}
      featureAppDefinition={myFeatureAppDefinition}
      featureAppKey="aside"
    />
  </aside>
</section>
```

#### Providing Externals

When using the browser module loader, the integrator can provide shared npm
dependencies to Feature Apps using the `defineExternals` function:

```js
import {defineExternals, loadAmdModule} from '@feature-hub/module-loader';
import * as React from 'react';
import Loadable from 'react-loadable';
```

```js
defineExternals({react: React, 'react-loadable': Loadable});

const manager = new FeatureAppManager(registry, loadAmdModule);
```

### Writing a Feature App

A Feature App must be bundled as a [UMD](https://github.com/umdjs/umd) module.
This JavaScript bundle file must be deployed to a publicly available endpoint.
The integrator uses this URL to place the Feature App onto a page using a
Feature App loader, e.g. `FeatureAppLoader`.

The default export of this module must be a `FeatureAppDefinition`. It consists
of an `id`, a `dependencies` object, and the method `create`.

#### Feature App ID

A Feature App definition must declare a unique consumer `id`. It is recommended
to use namespaces for the Feature App ID to avoid naming conflicts, e.g.:

```js
const id = 'acme:my-feature-app';
```

This ID is used to look up the config for a Feature App. Furthermore, it is used
as a consumer ID for Feature Services. If there is more than one instance of a
Feature App on a single page, the integrator must set a unique `featureAppKey`
for each Feature App with the same ID. The `FeatureServiceRegistry` then uses
the ID together with the key to create a unique consumer ID.

#### Feature App Dependencies

In `dependencies`, required Feature Services are declared with their service ID
and a [semver](https://semver.org) version string:

```js
const dependencies = {
  'acme:counter': '^2.0'
};
```

#### Feature App Instantiation

The method `create` takes the single argument `env`, which has the following
properties:

1.  `featureServices` — an object of Feature Services that are
    [semver-compatible](https://semver.org) with the declared dependencies.
1.  `config` — a consumer config object that is provided by the integrator.

A Feature App can either be a "React Feature App" or a "DOM Feature App".

1.  A React Feature App definition's `create` method returns a Feature App
    object with a `render` method that itself returns a `ReactNode`.

    ```js
    export default {
      id,
      dependencies,

      create(env) {
        return {
          render: () => <div>Foo</div>
        };
      }
    };
    ```

    **Note:** Since this element is directly rendered by React, the standard
    React lifecyle methods can be used (if `render` returns an instance of a
    React component class).

1.  A DOM Feature App definition's `create` method returns a Feature App object
    with an `attachTo` method that accepts a DOM container element.

    ```js
    export default {
      id,
      dependencies,

      create(env) {
        return {
          attachTo(container) {
            container.innerText = 'Foo';
          }
        };
      }
    };
    ```

#### Registering Feature Services

A Feature App can also register its own Feature Services by declaring
`ownFeatureServiceDefinitions`, e.g.:

```js
import {myFeatureServiceDefinition} from './my-feature-service';

export default {
  id: 'acme:my-feature-app',

  dependencies: {
    'acme:my-feature-service': '^1.0'
  },

  ownFeatureServiceDefinitions: [myFeatureServiceDefinition],

  create(env) {
    const myFeatureService = env.featureServices['acme:my-feature-service'];

    myFeatureService.init(42);

    return {
      render: () => <div>{myFeatureService.getSomeSharedState()}</div>
    };
  }
};
```

This allows teams to quickly get Feature Apps off the ground, without being
dependent on the integrator. However, as soon as other teams need to use this
Feature Service, it should be published and included in the global set of
Feature Services by the integrator.

#### Using Externals

If the integrator has provided externals (see above) to Feature Apps, they
should define these externals in their build config. For example, defining
`react` as external in a webpack config would look like this:

```json
{
  "externals": {
    "react": "react"
  }
}
```

### Writing a Feature Service

A Feature Service definition consists of an `id`, a `dependencies` object, and a
`create` method.

#### Feature Service ID & Dependencies

A Feature Service provider must declare a unique consumer `id`. It is
recommended to use namespaces in the Feature Service ID to avoid naming
conflicts, e.g.:

```js
const id = 'acme:my-feature-service';
```

The Feature Service ID is referenced by other consumers in their `dependencies`
declaration along with a [semver](https://semver.org) version string, e.g.:

```js
const dependencies = {
  'acme:my-feature-service': '^2.0'
};
```

#### Feature Service Instantiation & Programmatic Versioning

The `create` method of a Feature Service definition is called exactly once by
the Feature Service registry. It should store, and possibly initialize, any
shared state. The method takes the single argument `env`, which has the
following properties:

1.  `featureServices` — an object with Feature Services that are
    [semver-compatible](https://semver.org) with the declared dependencies.
1.  `config` — a consumer config object that is provided by the integrator.

A Feature Service provider can support multiple major versions at the same time
which have access to the same underlying shared state. The `create` method must
return an object with a so-called Feature Service binder for each supported
major version. The Feature Service binder is a function that is called for each
consumer. It returns a Feature Service binding with a consumer-bound
`featureService` and an optional `unbind` method. The Feature Service registry
passes the bound Feature Service to the consumer's `create` method.

With this in mind, a simple counter Feature Service could look like this:

```js
function create(env) {
  let count = env.config.initialCount || 0;

  const v1 = uniqueConsumerId => ({
    featureService: {
      plus() {
        count += 1;
      },

      minus() {
        count -= 1;
      }
    }
  });

  return {'1.0': v1};
}
```

Let's say after the first release of this Feature Service, the Feature Service
provider noticed that there is no way to retrieve the current count. Therefore,
they introduce the method `getCount` in version `1.1`:

```js
function create(env) {
  let count = env.config.initialCount || 0;

  const v1 = uniqueConsumerId => ({
    featureService: {
      plus() {
        count += 1;
      },

      minus() {
        count -= 1;
      },

      getCount() {
        return count;
      }
    }
  });

  return {'1.1': v1};
}
```

The version of a Feature Service needs to be incremented in a
[semver-compatible](https://semver.org) manner (without the need for a patch
version). In this case, a method is added, leading to a minor version bump.

In general, breaking changes should be avoided. If a Feature Service provider
still needs to make breaking changes, a new Feature Service implementation for
the next major version should be added. Old major versions should still be
supported.

Furthermore, it is possible to add deprecation warnings, and later remove
deprecated APIs.

In our example the Feature Service provider decides to rename the `plus`/`minus`
methods to `increment`/`decrement` and adds deprecation warnings (using a
fictive logger Feature Service that is declared as a dependency):

```js
function create(env) {
  let count = env.config.initialCount || 0;

  const getCount = () => count;
  const decrement = () => void --count;
  const increment = () => void ++count;

  const logger = env.featureServices['acme:logger'];

  const v1 = uniqueConsumerId => ({
    featureService: {
      getCount,

      plus() {
        logger.warn('Deprecation warning: use increment instead of plus.');
        increment();
      },

      minus() {
        logger.warn('Deprecation warning: use decrement instead of minus.');
        decrement();
      }
    }
  });

  const v2 = uniqueConsumerId => ({
    featureService: {getCount, increment, decrement}
  });

  return {'1.1': v1, '2.0': v2};
}
```

#### Feature Service Definition

Finally, the `id`, the `dependencies` object, and the `create` method constitute
the Feature Service definition that needs to be exported:

```js
export const counterDefinition = {
  id: 'acme:counter',
  dependencies: {'acme:logger': '^1.0'},
  create
};
```

#### Feature Service Binding

Declaring a Feature Service binder (for each major version) allows Feature
Service providers to create and destroy consumer-specific state.

Let's assume our counter Feature Service, instead of handling a global count, is
supposed to handle consumer-specific counts, as well as expose a total of all
consumer-specific counts.

With our Feature Service binders, this could be implemented like this:

```js
function create(env) {
  // Shared state lives here.
  let consumerCounts = {};

  return {
    '1.0': uniqueConsumerId => {
      // Consumer state lives here.
      consumerCounts[uniqueConsumerId] = 0;

      const unbind = () => {
        delete consumerCounts[uniqueConsumerId];
      };

      const featureService = {
        increment() {
          consumerCounts[uniqueConsumerId] += 1;
        },

        decrement() {
          consumerCounts[uniqueConsumerId] -= 1;
        },

        get count() {
          return consumerCounts[uniqueConsumerId];
        },

        get totalCount() {
          return Object.values(consumerCounts).reduce(
            (totalCount, consumerCount) => totalCount + consumerCount,
            0
          );
        }
      };

      return {featureService, unbind};
    }
  };
}
```

## Contributing to the Feature Hub

The main purpose of this monorepo is to further develop the Feature Hub. It is
developed in the open on GitHub, and we are grateful to the community for
contributing bugfixes and improvements.

To get started, install the dependencies, build the sources, and run the tests:

```sh
yarn && yarn build && yarn test
```

### Code of Conduct

Please note that this project is released with a
[Contributor Code of Conduct](./CODE_OF_CONDUCT.md). By participating in this
project you agree to abide by its terms.

### Development Scripts

- `yarn compile`: Compiles all sources.
- `yarn bundle`: Bundles all (example) Feature Apps.
- `yarn generate-docs`: Generates the API documentation.
- `yarn lint`: Lints all sources.
- `yarn test`: Executes all unit tests.
- `yarn verify`: Verifies non-functional requirements (used on CI).
- `yarn format`: Formats all files.
- `yarn sort-package-jsons`: Sorts all `package.json` files.
- `yarn watch`: Watches all sources and all unit tests.
- `yarn watch:compile`: Watches all sources.
- `yarn watch:test`: Watches all unit tests.

### Publishing a New Release

Instead of letting the CI automatically publish on every master merge, the
Feature Hub package releases are triggered manually.

To create a new semantic npm release for all Feature Hub packages, core team
members must trigger a custom [Travis CI](https://travis-ci.com) build on the
`master` branch. You should leave the custom config and commit message fields
empty.

[core-api]: https://sinnerschrader.github.io/feature-hub/api/@feature-hub/core/
[core-badge]: https://img.shields.io/npm/v/@feature-hub/core.svg
[core-pkg]:
  https://github.com/sinnerschrader/feature-hub/tree/master/packages/core
[core-npm]: https://www.npmjs.com/package/@feature-hub/core
[module-loader-api]:
  https://sinnerschrader.github.io/feature-hub/api/@feature-hub/module-loader/
[module-loader-badge]:
  https://img.shields.io/npm/v/@feature-hub/module-loader.svg
[module-loader-pkg]:
  https://github.com/sinnerschrader/feature-hub/tree/master/packages/module-loader
[module-loader-npm]: https://www.npmjs.com/package/@feature-hub/module-loader
[react-api]:
  https://sinnerschrader.github.io/feature-hub/api/@feature-hub/react/
[react-badge]: https://img.shields.io/npm/v/@feature-hub/react.svg
[react-pkg]:
  https://github.com/sinnerschrader/feature-hub/tree/master/packages/react
[react-npm]: https://www.npmjs.com/package/@feature-hub/react
[server-renderer-api]:
  https://sinnerschrader.github.io/feature-hub/api/@feature-hub/server-renderer/
[server-renderer-badge]:
  https://img.shields.io/npm/v/@feature-hub/server-renderer.svg
[server-renderer-pkg]:
  https://github.com/sinnerschrader/feature-hub/tree/master/packages/server-renderer
[server-renderer-npm]:
  https://www.npmjs.com/package/@feature-hub/server-renderer
