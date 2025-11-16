import type { ApiResult, File, MediaType } from '../types/index.js';
import { fetch_, isImage, setGlobalHeaders, testMediaType } from '../utils/index.js';

type CoomerUser = { domain: string; service: string; id: string; name?: string };
type CoomerUserApi = { name: string };
type CoomerFile = { path: string; name: string };
type CoomerPost = {
  title: string;
  content: string;
  published: string;
  attachments: CoomerFile[];
  file: CoomerFile;
};

const SERVERS = ['n1', 'n2', 'n3', 'n4'];

export function tryFixCoomerUrl(url: string, attempts: number) {
  if (attempts < 2 && isImage(url)) {
    return url.replace(/\/data\//, '/thumbnail/data/').replace(/n\d\./, 'img.');
  }
  const server = url.match(/n\d\./)?.[0].slice(0, 2) as string;
  const i = SERVERS.indexOf(server);
  if (i !== -1) {
    const newServer = SERVERS[(i + 1) % SERVERS.length];
    return url.replace(/n\d./, `${newServer}.`);
  }
  return url;
}

async function getUserProfileAPI(user: CoomerUser): Promise<CoomerUserApi> {
  const url = `${user.domain}/api/v1/${user.service}/user/${user.id}/profile`;
  const result = await fetch_(url).then((r) => r.json());
  return result as CoomerUserApi;
}

async function getUserPostsAPI(user: CoomerUser, offset: number): Promise<CoomerPost[]> {
  const url = `${user.domain}/api/v1/${user.service}/user/${user.id}/posts?o=${offset}`;
  const posts = await fetch_(url).then((r) => r.json());
  return posts as CoomerPost[];
}

export async function getUserFiles(user: CoomerUser, mediaType: MediaType): Promise<File[]> {
  const userPosts = [];

  const offset = 50;
  for (let i = 0; i < 1000; i++) {
    const posts = await getUserPostsAPI(user, i * offset);
    userPosts.push(...posts);
    if (posts.length < 50) break;
  }

  const files: File[] = [];

  for (const p of userPosts) {
    const title = p.title.match(/\w+/g)?.join(' ') || '';
    const content = p.content;
    const date = p.published.replace(/T/, ' ');
    const datentitle = `${date} ${title}`.trim();

    const postFiles = [...p.attachments, p.file]
      .filter((f) => f.path)
      .filter((f) => testMediaType(f.name, mediaType))
      .map((f, i) => {
        const ext = f.name.split('.').pop();
        const name = `${datentitle} ${i + 1}.${ext}`;
        const url = `${user.domain}/${f.path}`;
        return { name, url, content };
      });

    files.push(...postFiles);
  }

  return files;
}

async function parseUser(url: string): Promise<CoomerUser> {
  const [_, domain, service, id] = url.match(
    /(https:\/\/\w+\.\w+)\/(\w+)\/user\/([\w|.|-]+)/,
  ) as RegExpMatchArray;
  if (!domain || !service || !id) console.error('Invalid URL', url);

  const { name } = await getUserProfileAPI({ domain, service, id });

  return { domain, service, id, name };
}

export async function getCoomerData(url: string, mediaType: MediaType): Promise<ApiResult> {
  setGlobalHeaders({ accept: 'text/css' });
  const user = await parseUser(url);
  const dirName = `${user.name}-${user.service}`;
  const files = await getUserFiles(user, mediaType);
  return { dirName, files };
}
