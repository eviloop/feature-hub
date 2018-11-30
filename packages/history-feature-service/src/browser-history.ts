import * as history from 'history';
import {BaseHistory, belongsToCombinedLocation} from './base-history';

export class BrowserHistory extends BaseHistory {
  public listen(
    listener: history.LocationListener
  ): history.UnregisterCallback {
    const consumerUnregister = this.consumerHistory.listen(listener);

    const browserUnregister = this.combinedHistory.listen(
      (location, action) => {
        if (action === 'POP') {
          this.handlePop(location);
        }
      }
    );

    const unregister = () => {
      consumerUnregister();
      browserUnregister();
    };

    this.unregisterCallbacks.push(unregister);

    return unregister;
  }

  private handlePop(location: history.Location): void {
    const consumerLocationIndex = this.consumerHistory.entries.findIndex(
      belongsToCombinedLocation(location)
    );

    if (consumerLocationIndex === -1) {
      return;
    }

    const n = consumerLocationIndex - this.consumerHistory.index;

    // We use the memory history go() method, which mimics the behaviour
    // of a POP action best.
    if (n !== 0) {
      if (this.consumerHistory.canGo(n)) {
        this.consumerHistory.go(n);
      } else {
        console.warn(
          `Inconsistent consumer history for "${
            this.consumerId
          }". Can not apply popstate event for location:`,
          location,
          this.consumerHistory.entries
        );
      }
    }
  }
}
