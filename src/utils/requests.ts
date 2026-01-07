import { CookieAgent } from 'http-cookie-agent/undici';
import { CookieJar } from 'tough-cookie';
import { fetch, interceptors, setGlobalDispatcher } from 'undici';

function setCookieJarDispatcher() {
  const jar = new CookieJar();
  const agent = new CookieAgent({ cookies: { jar } })
    .compose(interceptors.retry())
    .compose(interceptors.redirect({ maxRedirections: 3 }));
  setGlobalDispatcher(agent);
}

setCookieJarDispatcher();

export const HeadersDefault = new Headers({
  accept: 'application/json, text/css',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
});

export function setGlobalHeaders(headers: Record<string, string>) {
  Object.keys(headers).forEach((k) => {
    HeadersDefault.set(k, headers[k]);
  });
}

export function fetchWithGlobalHeader(url: string) {
  const requestHeaders = new Headers(HeadersDefault);
  return fetch(url, { headers: requestHeaders });
}

export function fetchByteRange(
  url: string,
  downloadedSize: number,
  signal?: AbortSignal,
) {
  const requestHeaders = new Headers(HeadersDefault);
  requestHeaders.set('Range', `bytes=${downloadedSize}-`);
  return fetch(url, { headers: requestHeaders, signal });
}
