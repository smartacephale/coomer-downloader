import fetch from 'node-fetch';
import { testMediaType } from './../utils.js';

const SERVERS = ['n1', 'n2', 'n3', 'n4'];

export function tryFixCoomerUrl(url) {
  const server = url.match(/n\d./)[0].slice(0,2);
  const i = SERVERS.indexOf(server);
  if (i !== -1) {
    const newServer = SERVERS[(i+1)%SERVERS.length];
    return url.replace(/n\d./, `${newServer}.`);
  }
  return url;
}

const userProfileAPI = ({ domain, service, id }) =>
  `${domain}/api/v1/${service}/user/${id}/profile`;

const userPostsAPI = (user, offset) =>
  `${user.domain}/api/v1/${user.service}/user/${user.id}?o=${offset}`;

export async function getUserFiles(user, typeFilter) {
  const userPosts = [];

  const offset = 50;
  for (let i = 0; i < 1000; i++) {
    const posts = await fetch(userPostsAPI(user, offset * i)).then((r) =>
      r.json(),
    );
    userPosts.push(...posts);
    if (posts.length < 50) break;
  }

  const files = [];

  for (const p of userPosts) {
    const title = p.title.match(/\w+/g)?.join(' ') || '';
    const content = p.content;
    const date = p.published.replace(/T/, ' ');
    const datentitle = `${date} ${title}`.trim();

    const postFiles = [...p.attachments, p.file]
      .filter((f) => f.path)
      .filter((f) => testMediaType(f.name, typeFilter))
      .map((f, i) => {
        const ext = f.name.split('.').pop();
        const name = `${datentitle} ${i + 1}.${ext}`;
        const src = `${user.domain}/${f.path}`;
        return { name, src, content };
      });

    files.push(...postFiles);
  }

  return files;
}

async function parseUser(url) {
  const [_, domain, service, id] = url.match(
    /(https:\/\/\w+\.\w+)\/(\w+)\/user\/([\w|\.|-]+)/,
  );
  if (!domain || !service || !id) console.error('Invalid URL', url);

  const { name } = await fetch(userProfileAPI({ domain, service, id })).then(
    (r) => r.json(),
  );

  return { domain, service, id, name };
}

export async function getCoomerData(url, mediaType) {
  const user = await parseUser(url);
  const dirName = `${user.name}-${user.service}`;
  const files = await getUserFiles(user, mediaType);
  return { dirName, files };
}
