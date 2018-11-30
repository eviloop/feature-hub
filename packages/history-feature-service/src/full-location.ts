import * as history from 'history';
import {
  addConsumerPath,
  getConsumerPath,
  removeConsumerPath
} from './consumer-paths';

export interface FullLocationOptions {
  readonly consumerPathsQueryParamName: string;
  readonly primaryConsumerId?: string;
}

export interface FullLocationTransformer {
  getConsumerPathFromFullLocation(
    fullLocation: history.Location,
    consumerId: string
  ): string | undefined;

  createFullLocation(
    consumerLocation: history.Location | undefined,
    fullLocation: history.Location,
    consumerId: string
  ): history.LocationDescriptorObject;
}

export function createFullLocationTransformer(
  options: FullLocationOptions
): FullLocationTransformer {
  return {
    getConsumerPathFromFullLocation: (
      fullLocation: history.Location,
      consumerId: string
    ): string | undefined => {
      const {consumerPathsQueryParamName, primaryConsumerId} = options;
      const isPrimaryConsumer = consumerId === primaryConsumerId;
      const searchParams = getSearchParams(fullLocation);

      if (isPrimaryConsumer) {
        searchParams.delete(consumerPathsQueryParamName);

        const pathname = fullLocation.pathname;
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

    createFullLocation: (
      consumerLocation: history.Location | undefined,
      fullLocation: history.Location,
      consumerId: string
    ): history.LocationDescriptorObject => {
      const {consumerPathsQueryParamName, primaryConsumerId} = options;
      const isPrimaryConsumer = consumerId === primaryConsumerId;

      if (isPrimaryConsumer) {
        return createFullLocationForPrimaryConsumer(
          fullLocation,
          consumerLocation,
          consumerPathsQueryParamName
        );
      } else {
        return createFullLocationForOtherConsumer(
          fullLocation,
          consumerLocation,
          consumerId,
          consumerPathsQueryParamName
        );
      }
    }
  };
}

function createFullLocationForPrimaryConsumer(
  fullLocation: history.Location,
  consumerLocation: history.Location | undefined,
  consumerPathsQueryParamName: string
): history.LocationDescriptorObject {
  const allSearchParams = getSearchParams(fullLocation);
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

function createFullLocationForOtherConsumer(
  fullLocation: history.Location,
  consumerLocation: history.Location | undefined,
  consumerId: string,
  consumerPathsQueryParamName: string
): history.LocationDescriptorObject {
  const allSearchParams = getSearchParams(fullLocation);
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
    pathname: fullLocation.pathname,
    search: allSearchParams.toString()
  };
}

function getSearchParams(
  location: history.Location | undefined
): URLSearchParams {
  return new URLSearchParams(location && location.search);
}
