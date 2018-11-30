import * as history from 'history';
import {
  addConsumerPath,
  getConsumerPath,
  removeConsumerPath
} from './consumer-paths';

export interface RootLocationOptions {
  readonly consumerPathsQueryParamName: string;
  readonly primaryConsumerId?: string;
}

export interface RootLocationTransformer {
  getConsumerPathFromRootLocation(
    rootLocation: history.Location,
    consumerId: string
  ): string | undefined;

  createRootLocation(
    consumerLocation: history.Location | undefined,
    rootLocation: history.Location,
    consumerId: string
  ): history.LocationDescriptorObject;
}

export function createRootLocationTransformer(
  options: RootLocationOptions
): RootLocationTransformer {
  return {
    getConsumerPathFromRootLocation: (
      rootLocation: history.Location,
      consumerId: string
    ): string | undefined => {
      const {consumerPathsQueryParamName, primaryConsumerId} = options;
      const isPrimaryConsumer = consumerId === primaryConsumerId;
      const searchParams = getSearchParams(rootLocation);

      if (isPrimaryConsumer) {
        searchParams.delete(consumerPathsQueryParamName);

        const pathname = rootLocation.pathname;
        const search = searchParams.toString();

        return history.createPath({pathname, search});
      } else {
        const consumerPaths = searchParams.get(consumerPathsQueryParamName);

        if (!consumerPaths) {
          return undefined;
        }

        return getConsumerPath(consumerPaths, consumerId);
      }
    },

    createRootLocation: (
      consumerLocation: history.Location | undefined,
      rootLocation: history.Location,
      consumerId: string
    ): history.LocationDescriptorObject => {
      const {consumerPathsQueryParamName, primaryConsumerId} = options;
      const isPrimaryConsumer = consumerId === primaryConsumerId;

      if (isPrimaryConsumer) {
        return createRootLocationForPrimaryConsumer(
          rootLocation,
          consumerLocation,
          consumerPathsQueryParamName
        );
      } else {
        return createRootLocationForOtherConsumer(
          rootLocation,
          consumerLocation,
          consumerId,
          consumerPathsQueryParamName
        );
      }
    }
  };
}

function createRootLocationForPrimaryConsumer(
  rootLocation: history.Location,
  consumerLocation: history.Location | undefined,
  consumerPathsQueryParamName: string
): history.LocationDescriptorObject {
  const allSearchParams = getSearchParams(rootLocation);
  const consumerPaths = allSearchParams.get(consumerPathsQueryParamName);
  const pathname = consumerLocation ? consumerLocation.pathname : '/';

  let search: string;

  if (consumerPaths) {
    const newSearchParams = getSearchParams(consumerLocation);
    newSearchParams.set(consumerPathsQueryParamName, consumerPaths);
    search = newSearchParams.toString();
  } else {
    search = consumerLocation ? consumerLocation.search : '';
  }

  return {pathname, search};
}

function createRootLocationForOtherConsumer(
  rootLocation: history.Location,
  consumerLocation: history.Location | undefined,
  consumerId: string,
  consumerPathsQueryParamName: string
): history.LocationDescriptorObject {
  const allSearchParams = getSearchParams(rootLocation);
  const consumerPaths = allSearchParams.get(consumerPathsQueryParamName);

  const newConsumerPaths = consumerLocation
    ? addConsumerPath(
        consumerPaths,
        consumerId,
        history.createPath(consumerLocation)
      )
    : removeConsumerPath(consumerPaths, consumerId);

  if (newConsumerPaths) {
    allSearchParams.set(consumerPathsQueryParamName, newConsumerPaths);
  } else {
    allSearchParams.delete(consumerPathsQueryParamName);
  }

  return {
    pathname: rootLocation.pathname,
    search: allSearchParams.toString()
  };
}

function getSearchParams(
  location: history.Location | undefined
): URLSearchParams {
  return new URLSearchParams(location && location.search);
}
