import { CoomerFile } from '../../core/file';
import { CoomerFileList } from '../../core/filelist';
import { isImage } from '../../utils/mediatypes';
import { fetchWithGlobalHeader, setGlobalHeaders } from '../../utils/requests';
import type { ProviderAPI } from '../provider';

interface CoomerServiceAPI {
  user: { domain: string; service: string; id: string; name?: string };
  userData: { name: string };
  file: { path: string; name: string };
  post: {
    title: string;
    content: string;
    published: string;
    attachments: CoomerServiceAPI['file'][];
    file: CoomerServiceAPI['file'];
  };
}

type CoomerAPIUser = CoomerServiceAPI['user'];
type CoomerAPIUserData = CoomerServiceAPI['userData'];
type CoomerAPIFile = CoomerServiceAPI['file'];
type CoomerAPIPost = CoomerServiceAPI['post'];

async function getUserProfileData(user: CoomerAPIUser): Promise<CoomerAPIUserData> {
  const url = `${user.domain}/api/v1/${user.service}/user/${user.id}/profile`;
  const result = await fetchWithGlobalHeader(url).then((r) => r.json());
  return result as CoomerAPIUserData;
}

async function getUserPostsAPI(
  user: CoomerAPIUser,
  offset: number,
): Promise<CoomerAPIPost[]> {
  const url = `${user.domain}/api/v1/${user.service}/user/${user.id}/posts?o=${offset}`;
  const posts = await fetchWithGlobalHeader(url).then((r) => r.json());
  return posts as CoomerAPIPost[];
}

export async function getUserFiles(user: CoomerAPIUser): Promise<CoomerFileList> {
  const userPosts = [];

  const offset = 50;
  for (let i = 0; i < 10_000; i++) {
    const posts = await getUserPostsAPI(user, i * offset);
    userPosts.push(...posts);
    if (posts.length < offset) break;
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
        const url = getUrl(f, user);
        return CoomerFile.from({ name, url, content });
      });

    filelist.files.push(...postFiles);
  }

  return filelist;
}

function getUrl(f: CoomerAPIFile, user: CoomerAPIUser) {
  // Normalize f.path to avoid protocol-relative or multiple-leading-slash paths
  const normalizedPath = f.path.replace(/^\/+/, '/');
  let url = '';
  try {
    url = new URL(normalizedPath, user.domain).toString();
  } catch (_) {
    // Fallback: join with a single slash
    url = `${user.domain}/${normalizedPath.replace(/^\//, '')}`;
  }
  return url;
}

async function parseUser(url: string): Promise<CoomerAPIUser> {
  const [_, domain, service, id] = url.match(
    /(https:\/\/\w+\.\w+)\/(\w+)\/user\/([\w|.|-]+)/,
  ) as RegExpMatchArray;
  if (!domain || !service || !id) console.error('Invalid URL', url);

  const { name } = await getUserProfileData({ domain, service, id });

  return { domain, service, id, name };
}

export class CoomerAPI implements ProviderAPI {
  private static readonly SERVERS = ['n1', 'n2', 'n3', 'n4'];

  public fixURL(url: string, retries: number): string {
    if (retries < 2 && isImage(url)) {
      return url.replace(/\/data\//, '/thumbnail/data/').replace(/n\d\./, 'img.');
    }
    const server = url.match(/n\d\./)?.[0].slice(0, 2) as string;
    const i = CoomerAPI.SERVERS.indexOf(server);
    if (i !== -1) {
      const newServer = CoomerAPI.SERVERS[(i + 1) % CoomerAPI.SERVERS.length];
      return url.replace(/n\d./, `${newServer}.`);
    }
    return url;
  }

  public testURL(url: URL) {
    return /coomer|kemono/.test(url.origin);
  }

  public async getData(url: string): Promise<CoomerFileList> {
    setGlobalHeaders({ accept: 'text/css' });
    const user = await parseUser(url);
    const filelist = await getUserFiles(user);
    filelist.dirName = `${user.name}-${user.service}`;
    return filelist;
  }
}
