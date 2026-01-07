import { fetch } from 'undici';
import { CoomerFile } from '../../core';
import { CoomerFileList } from '../../core/filelist';
import type { ProviderAPI } from '../provider';

type RedditAPIPosts = {
  data: {
    posts: Array<{
      id: number;
      content: {
        title: string;
        description: string;
      };
      data: {
        url: string;
        videos: {
          mp4: string;
        };
        videos_v2: Array<{
          format: string;
          url: string;
        }>;
      };
      publishedAt: string;
    }>;
  };
};

async function getUserPage(user: string, offset: number): Promise<RedditAPIPosts> {
  const url = `https://nsfw.xxx/api/v1/user/${user}/newest?page=${offset}&types[]=image&types[]=video&types[]=gallery&nsfw[]=0&nsfw[]=1&nsfw[]=2&nsfw[]=3&nsfw[]=4`;
  const res = await fetch(url).then((r) => r.json());
  return res as RedditAPIPosts;
}

async function getUserPostsData(user: string): Promise<CoomerFileList> {
  const filelist = new CoomerFileList();

  for (let i = 1; i < 10_000; i++) {
    const { data } = await getUserPage(user, i);
    if (data.posts.length < 1) break;

    data.posts.forEach((post) => {
      const date = post.publishedAt;
      const title = post.content.title;
      const name = `${date} ${title}`;

      const preview = post.data.url;

      const files = (post.data.videos_v2 || []).filter((f) => !f.url.includes('imgur'));
      if (files?.length === 0 && preview) {
        files.push({ format: 'jpg', url: preview });
      }

      files.forEach(({ format, url }, i) => {
        const index = i > 0 ? ` ${i}` : '';
        const _name = `${name}${index}.${format}`;
        filelist.files.push(CoomerFile.from({ name: _name, url }));
      });
    });
  }

  return filelist;
}

export class RedditAPI implements ProviderAPI {
  public testURL(url: URL) {
    return /^\/user\/[\w-]+$/.test(url.pathname);
  }

  public async getData(url: string): Promise<CoomerFileList> {
    const user = url.match(/\/user\/([\w-]+)/)?.[1] as string;
    const filelist = await getUserPostsData(user);
    filelist.dirName = `${user}-reddit`;
    return filelist;
  }
}
