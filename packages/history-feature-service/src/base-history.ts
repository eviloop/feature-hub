import * as history from 'history';
import {FullLocationTransformer} from './full-location';

export interface ConsumerHistory extends history.History {
  destroy(): void;
}

export abstract class BaseHistory implements ConsumerHistory {
  protected readonly consumerHistory: history.MemoryHistory;
  protected readonly unregisterCallbacks: history.UnregisterCallback[] = [];

  public constructor(
    protected readonly consumerId: string,
    protected readonly combinedHistory: history.History,
    private readonly fullLocationTransformer: FullLocationTransformer
  ) {
    const initialConsumerPath = this.getConsumerPathFromFullLocation(
      combinedHistory.location
    );

    this.consumerHistory = history.createMemoryHistory({
      initialEntries: initialConsumerPath ? [initialConsumerPath] : undefined
    });

    // Set the combined history key for the initial consumer location.
    this.setCombinedHistoryKey(this.consumerHistory.location);
  }

  public get length(): number {
    return this.consumerHistory.length;
  }

  public get action(): history.Action {
    return this.consumerHistory.action;
  }

  public get location(): history.Location {
    return this.consumerHistory.location;
  }

  public push(
    pathOrLocation: history.LocationDescriptor,
    state?: history.LocationState
  ): void {
    const consumerLocation = history.createLocation(pathOrLocation, state);

    this.persistConsumerLocation(consumerLocation, 'push');
  }

  public replace(
    pathOrLocation: history.LocationDescriptor,
    state?: history.LocationState
  ): void {
    const consumerLocation = history.createLocation(pathOrLocation, state);

    this.persistConsumerLocation(consumerLocation, 'replace');
  }

  public go(_n: number): void {
    console.warn('history.go() is not supported.');
  }

  public goBack(): void {
    console.warn('history.goBack() is not supported.');
  }

  public goForward(): void {
    console.warn('history.goForward() is not supported.');
  }

  public block(
    prompt?: boolean | string | history.TransitionPromptHook
  ): history.UnregisterCallback {
    return this.consumerHistory.block(prompt);
  }

  public abstract listen(
    listener: history.LocationListener
  ): history.UnregisterCallback;

  public createHref(location: history.LocationDescriptorObject): history.Href {
    const consumerLocation = history.createLocation(location);

    return this.combinedHistory.createHref(
      this.createFullLocation(consumerLocation)
    );
  }

  public destroy(): void {
    this.unregisterCallbacks.forEach(unregister => unregister());
    this.combinedHistory.replace(this.createFullLocation(undefined));
  }

  protected createFullLocation(
    consumerLocation: history.Location | undefined
  ): history.LocationDescriptorObject {
    return this.fullLocationTransformer.createFullLocation(
      consumerLocation,
      this.combinedHistory.location,
      this.consumerId
    );
  }

  private persistConsumerLocation(
    consumerLocation: history.Location,
    method: 'push' | 'replace'
  ): void {
    this.combinedHistory[method](this.createFullLocation(consumerLocation));
    this.setCombinedHistoryKey(consumerLocation);
    this.consumerHistory[method](consumerLocation);
  }

  private getConsumerPathFromFullLocation(
    location: history.Location
  ): string | undefined {
    return this.fullLocationTransformer.getConsumerPathFromFullLocation(
      location,
      this.consumerId
    );
  }

  private setCombinedHistoryKey(consumerLocation: history.Location): void {
    consumerLocation.state = {
      ...consumerLocation.state,
      combinedHistoryKey: this.combinedHistory.location.key
    };
  }
}

export function belongsToCombinedLocation(
  combinedLocation: history.Location
): (consumerLocation: history.Location) => boolean {
  return (consumerLocation: history.Location): boolean => {
    if (!combinedLocation.key || !consumerLocation.state) {
      return false;
    }

    return consumerLocation.state.combinedHistoryKey === combinedLocation.key;
  };
}
