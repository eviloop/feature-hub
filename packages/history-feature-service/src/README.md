# History Feature Service

> A [history](https://www.npmjs.com/package/history) facade for safe access with
> multiple consumers on the same page.

## Motivation

When multiple feature apps coexist on the same page they can't access the
browser history API directly since there is only one. This service provides an
abstraction to enable save access to the history for multiple consumers.

## Functional Behaviour

The service encodes multiple consumer histories into a single one. It does this
by merging all registered consumer locations into one, and persisting the joined
location on the history stack. As long as the consumer performs all history and
location interactions through the history it obtained from the service the
existance of the facade and other consumers is transparent. The consumer only
receives events (like e.g. POP) for location changes that effect the consumer
specific location.

### Location Transformer

How the root location is build from the consumer locations is a problem that can
not be solved generally since it is dependant on the usecase. This is why the
integrator initializes the service factory with something called a location
transformer. The location transformer provides functions for merging and
seperating the consumer locations to and from the root location.

For a quick out of the box experience this package also provides a location
transformer ready for use. The included location transformer has the concept of
a primary consumer. Only the primaries location will directly get encoded into
the root location. All other consumer locations are encoded into a json string
which will be assigned to a single configurable query parameter.

## Usage

### as a Consumer

In the browser:

```js
export default {
  id: 'acme:my-feature-app',

  dependencies: {
    's2:history': '^1.0'
  },

  create(env) {
    const history = env.featureService['s2:history'];
    const browserHistory = history.createBrowserHistory();

    return {
      render: () => (
        <div>Current consumer path: {browserHistory.location.pathname}</div>
      )
    };
  }
};
```

On the server:

```js
export default {
  id: 'acme:my-feature-app',

  dependencies: {
    's2:server-renderer': '^1.0',
    's2:history': '^1.0'
  },

  create(env) {
    const history = env.featureService['s2:history'];
    const memoryHistory = history.createMemoryHistory();

    return {
      render: () => (
        <div>Current consumer path: {memoryHistory.location.pathname}</div>
      )
    };
  }
};
```

For both the browser and the memory history the service is API compatible with
the history package. For further information reference
[its documentation](https://www.npmjs.com/package/history).

### as the Integrator

The integrator initializes the service with a
[location transformer](#location-transformer) and provides it to the services
registry:

```js
// In the browser:
import {FeatureServiceRegistry} from '@feature-hub/core';
import {createHistoryServiceDefinition} from '@feature-hub/history-feature-service';
import {createServerRendererProviderDefinition} from '@feature-hub/ssr-feature-service';

const registry = new FeatureServiceRegistry(configs);

const featureServiceDefinitions = [
  createHistoryServiceDefinition(),
  createServerRendererProviderDefinition()
];

registry.registerProviders(featureServiceDefinitions, 'integrator');
```

The history service has a dependency on the server renderer feature service
since on the server it uses the information from the request the server renderer
was initialized with to obtain the initial url:

```js
// On the server:
import {FeatureServiceRegistry} from '@feature-hub/core';
import {
  createHistoryServiceDefinition,
  createRootLocationTransformer
} from '@feature-hub/history-feature-service';
import {createServerRendererProviderDefinition} from '@feature-hub/ssr-feature-service';

const registry = new FeatureServiceRegistry(configs);

const rootLocationTransformer = createRootLocationTransformer({
  consumerPathsQueryParamName: '---'
});

const featureServiceDefinitions = [
  createHistoryServiceDefinition(),
  createServerRendererProviderDefinition({
    path: '/request-path',
    cookies: {},
    headers: {}
  })
];

registry.registerProviders(featureServiceDefinitions, 'integrator');
```

#### Building a custom location transformer

A location transformer is an object exposing two functions,
`getConsumerPathFromRootLocation` and `createRootLocation`.

```js
import * as history from 'history';
// ...
const rootLocationTransformer = {
	getConsumerPathFromRootLocation: (
		rootLocation,
		consumerId
	) => {
    const searchParams = new URLSearchParams(rootLocation.search);
    return searchParams.get(consumerId);
  };

	createRootLocation: (
		consumerLocation: history.Location | undefined,
		rootLocation: history.Location,
		consumerId: string
	) => {
    let searchParams = new URLSearchParams(rootLocation.search);
    searchParams.set(
      consumerId,
      consumerLocation && history.createPath(consumerLocation)
    );

    return {
      ...rootLocation,
      search: searchParams.toString()
    };
  };
}
// ...
```
