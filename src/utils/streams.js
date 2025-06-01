import { Transform } from 'node:stream';
import { setInterval, clearInterval } from 'node:timers';

export class TransformWithTimeout extends Transform {
  lastChunkReceived;
  timeoutMilliseconds;
  timeoutInterval;

  constructor(timeoutSeconds, options) {
    super(options);
    if (timeoutSeconds === undefined) {
      throw new Error(
        'new Timeout(timeoutSeconds): timeoutSeconds is a required parameter.',
      );
    }
    this.timeoutMilliseconds = timeoutSeconds * 1000;
    this.timeoutInterval = setInterval(
      () => this._check(),
      this.timeoutMilliseconds,
    );
  }

  _check() {
    const millisecondsSinceLast = new Date().getTime() - this.lastChunkReceived;
    if (millisecondsSinceLast > this.timeoutMilliseconds) {
      this.emit('error', new Error(`Timed out: ${millisecondsSinceLast}ms`));
    }
  }

  _transform(chunk, encoding, callback) {
    this.lastChunkReceived = new Date().getTime();
    this.push(chunk);
    callback();
  }

  _flush(callback) {
    clearInterval(this.timeoutInterval);
    callback();
  }
}
