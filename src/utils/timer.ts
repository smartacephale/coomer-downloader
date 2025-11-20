export class Timer {
  private timer: NodeJS.Timeout | undefined = undefined;

  constructor(
    private timeout = 10_000,
    private timeoutCallback: () => void,
  ) {
    this.timeout = timeout;
  }

  start() {
    this.timer = setTimeout(() => {
      this.stop();
      this.timeoutCallback();
    }, this.timeout);
    return this;
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    return this;
  }

  reset() {
    this.stop();
    this.start();
    return this;
  }

  static withSignal(timeout?: number, message?: string) {
    const controller = new AbortController();

    const callback = () => {
      controller.abort(message);
    };

    const timer = new Timer(timeout, callback).start();

    return {
      timer,
      signal: controller.signal,
    };
  }
}
