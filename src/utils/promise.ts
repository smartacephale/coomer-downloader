export async function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

type PromiseRetryCallback = (retries: number, error: Error) => void | { newRetries?: number };

interface PromiseRetryOptions {
  retries?: number;
  callback?: PromiseRetryCallback;
  delay?: number;
}

export class PromiseRetry {
  private retries: number;
  private delay: number;
  private callback?: PromiseRetryCallback;

  constructor(options: PromiseRetryOptions) {
    this.retries = options.retries || 3;
    this.delay = options.delay || 1000;
    this.callback = options.callback;
  }

  async execute(fn: () => Promise<void>) {
    let retries = this.retries;

    while (true) {
      try {
        return await fn();
      } catch (error) {
        if (retries <= 0) {
          throw error;
        }

        if (this.callback) {
          const res = this.callback(retries, error as Error);
          if (res) {
            const { newRetries } = res;
            if (newRetries === 0) throw error;
            this.retries = newRetries || retries;
          }
        }

        await sleep(this.delay);
        retries--;
      }
    }
  }

  static create(options: PromiseRetryOptions) {
    return new PromiseRetry(options);
  }
}
