import { CoomerFile, CoomerFileList } from '../utils/file';
import { isImage } from '../utils/filters';
import { fetchWithGlobalHeader, setGlobalHeaders } from '../utils/requests';

type CoomerAPIUser = { domain: string; service: string; id: string; name?: string };
type CoomerAPIUserData = { name: string };
type CoomerAPIFile = { path: string; name: string };
type CoomerAPIPost = {
  title: string;
  content: string;
  published: string;
  attachments: CoomerAPIFile[];
  file: CoomerAPIFile;
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

async function getUserProfileData(user: CoomerAPIUser): Promise<CoomerAPIUserData> {
  const url = `${user.domain}/api/v1/${user.service}/user/${user.id}/profile`;
  const result = await fetchWithGlobalHeader(url).then((r) => r.json());
  return result as CoomerAPIUserData;
}

async function getUserPostsAPI(user: CoomerAPIUser, offset: number): Promise<CoomerAPIPost[]> {
  const url = `${user.domain}/api/v1/${user.service}/user/${user.id}/posts?o=${offset}`;
  const posts = await fetchWithGlobalHeader(url).then((r) => r.json());
  return posts as CoomerAPIPost[];
}

export async function getUserFiles(user: CoomerAPIUser): Promise<CoomerFileList> {
  const userPosts = [];

  const offset = 50;
  for (let i = 0; i < 1000; i++) {
    const posts = await getUserPostsAPI(user, i * offset);
    userPosts.push(...posts);
    if (posts.length < 50) break;
  }

  const filelist = new CoomerFileList();

  for (const p of userPosts) {
    const title = p.title.match(/\w+/g)?.join(' ') || '';
    const content = p.content;
    const date = p.published.replace(/T/, ' ');
    const datentitle = `${date} ${title}`.trim();

    const postFiles = [...p.attachments, p.file]
      .filter((f) => f.path)
      .map((f, i) => {
        const ext = f.name.split('.').pop();
        const name = `${datentitle} ${i + 1}.${ext}`;
        const url = `${user.domain}/${f.path}`;
        return CoomerFile.from({ name, url, content });
      });

    filelist.files.push(...postFiles);
  }

  return filelist;
}

async function parseUser(url: string): Promise<CoomerAPIUser> {
  const [_, domain, service, id] = url.match(
    /(https:\/\/\w+\.\w+)\/(\w+)\/user\/([\w|.|-]+)/,
  ) as RegExpMatchArray;
  if (!domain || !service || !id) console.error('Invalid URL', url);

  const { name } = await getUserProfileData({ domain, service, id });

  return { domain, service, id, name };
}

export async function getCoomerData(url: string): Promise<CoomerFileList> {
  setGlobalHeaders({ accept: 'text/css' });
  const user = await parseUser(url);
  const filelist = await getUserFiles(user);
  filelist.dirName = `${user.name}-${user.service}`;
  return filelist;
}
