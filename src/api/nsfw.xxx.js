import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { testMediaType } from './../utils.js';

const userPostsURL = (n, user) =>
  `https://nsfw.xxx/page/${n}?nsfw[]=0&types[]=image&types[]=video&types[]=gallery&slider=1&jsload=1&user=${user}&_=${Date.now()}`;

async function getUserPosts(user) {
  console.log('Fetching user posts...');
  const posts = [];
  for (let i = 1; i < 100000; i++) {
    const page = await fetch(userPostsURL(i, user)).then((r) => r.text());
    if (page.length < 1) break;

    const $ = cheerio.load(page);
    const newPosts = $('a')
      .map((_, a) => $(a).attr('href'))
      .get()
      .filter((href) => href?.startsWith('https://nsfw.xxx/post'));

    posts.push(...newPosts);
  }
  return posts;
}

async function getPostsData(posts, mediaType) {
  console.log('Fetching posts data...');
  const data = [];
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
      $('.sh-section .sh-section__passed').first().text().replace(/ /g, '-') ||
      '';

    const ext = src.split('.').pop();
    const name = `${slug}-${date}.${ext}`;

    data.push({ name, src });
  }

  return data.filter((f) => testMediaType(f.name, mediaType));
}

export async function getRedditData(url, mediaType) {
  const user = url.match(/u\/(\w+)/)[1];
  const posts = await getUserPosts(user);
  const files = await getPostsData(posts, mediaType);
  const dirName = `${user}-reddit`;
  return { dirName, files };
}
