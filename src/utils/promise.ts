export type FnAsync<T> = () => Promise<T>;

export async function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export async function promiseRetry<T>(
  fn: FnAsync<T>,
  callbackVerify?: () => boolean,
  retries = 3,
  delay = 1000,
) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    if (callbackVerify?.()) {
      retries = 1000;
    }
    return promiseRetry(fn, callbackVerify, retries - 1, delay);
  }
}
