import * as cheerio from 'cheerio';
import { fetch } from 'undici';
import { CoomerFile } from '../../core/file';
import { CoomerFileList } from '../../core/filelist';
import logger from '../../utils/logger';
import type { ProviderAPI } from '../provider';

async function getUserPage(user: string, offset: number) {
  const url = `https://nsfw.xxx/page/${offset}?nsfw[]=0&types[]=image&types[]=video&types[]=gallery&slider=1&jsload=1&user=${user}&_=${Date.now()}`;
  return fetch(url).then((r) => r.text());
}

async function getUserPosts(user: string): Promise<string[]> {
  const posts = [];
  for (let i = 1; i < 100000; i++) {
    const page = await getUserPage(user, i);
    if (page.length < 1) break;

    const $ = cheerio.load(page);
    const newPosts = $('a')
      .map((_, a) => $(a).attr('href'))
      .get()
      .filter((href) => href?.startsWith('https://nsfw.xxx/post'));

    logger.debug({ count: posts.length });
    posts.push(...newPosts);
  }
  return posts;
}

async function getPostsData(posts: string[]): Promise<CoomerFileList> {
  const filelist = new CoomerFileList();
  for (const post of posts) {
    const page = await fetch(post).then((r) => r.text());
    const $ = cheerio.load(page);

    const src =
      $('.sh-section .sh-section__image img').attr('src') ||
      $('.sh-section .sh-section__image video source').attr('src') ||
      null;

    if (!src) continue;

    const slug = post.split('post/')[1].split('?')[0];
    const date =
      $('.sh-section .sh-section__passed').first().text().replace(/ /g, '-') || '';

    const ext = src.split('.').pop();
    const name = `${slug}-${date}.${ext}`;

    logger.debug({ hehe: filelist.files.length, src });
    filelist.files.push(CoomerFile.from({ name, url: src }));
  }

  return filelist;
}

export class RedditAPI implements ProviderAPI {
  public testURL(url: URL) {
    return /^\/user\/[\w-]+$/.test(url.pathname);
  }

  public async getData(url: string): Promise<CoomerFileList> {
    const user = url.match(/^\/user\/([\w-]+)/)?.[1] as string;
    const posts = await getUserPosts(user);
    const filelist = await getPostsData(posts);
    filelist.dirName = `${user}-reddit`;
    return filelist;
  }
}
