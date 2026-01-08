import vm from 'node:vm';
import * as cheerio from 'cheerio';
import { fetch } from 'undici';
import { CoomerFile } from '../../core/file';
import { CoomerFileList } from '../../core/filelist';
import type { ProviderAPI } from '../provider';

type EncData = { url: string; timestamp: number };
type AlbumFiles = {
  name: string;
  original: string;
  slug: string;
  timestamp: string;
  thumbnail: string;
};

async function getEncryptionData(slug: string): Promise<EncData> {
  const response = await fetch('https://bunkr.cr/api/vs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: slug }),
  });
  return (await response.json()) as EncData;
}

function decryptEncryptedUrl(encryptionData: EncData) {
  const secretKey = `SECRET_KEY_${Math.floor(encryptionData.timestamp / 3600)}`;
  const encryptedUrlBuffer = Buffer.from(encryptionData.url, 'base64');
  const secretKeyBuffer = Buffer.from(secretKey, 'utf-8');
  return Array.from(encryptedUrlBuffer)
    .map((byte, i) =>
      String.fromCharCode(byte ^ secretKeyBuffer[i % secretKeyBuffer.length]),
    )
    .join('');
}

async function getGalleryFile(url: string): Promise<CoomerFile> {
  const page = await fetch(url).then((r) => r.text());
  const $ = cheerio.load(page);
  const name = $('h1').text();
  const slug = url.split('/').pop() as string;

  const encryptionData = await getEncryptionData(slug);
  const src = decryptEncryptedUrl(encryptionData);

  return CoomerFile.from({ name, url: src });
}

async function getGalleryFiles(url: string): Promise<CoomerFileList> {
  const filelist = new CoomerFileList();
  const page = await fetch(url).then((r) => r.text());
  const $ = cheerio.load(page);
  const { pathname, origin } = new URL(url);

  const title = $('title').text();
  filelist.dirName = `${title.split('|')[0].trim()}-bunkr`;

  const galleryFilePages: string[] = [];

  if (pathname.startsWith('/f/')) {
    galleryFilePages.push(url);
  } else {
    let targetScript: string | undefined;

    $('script').each((_, el) => {
      const content = $(el).html();
      if (content?.includes('window.albumFiles =')) {
        targetScript = content;
        return false;
      }
    });

    const albumFiles: AlbumFiles[] = [];

    if (targetScript) {
      const context = vm.createContext({ window: {} });
      const x = new vm.Script(targetScript);
      x.runInContext(context);

      if (context.window.albumFiles) {
        albumFiles.push(...context.window.albumFiles);
      }
    }

    if (albumFiles.length > 0) {
      const _url = new URL(origin);

      const links = albumFiles.map((f) => {
        _url.pathname = `/f/${f.slug}`;
        return _url.toString();
      });

      galleryFilePages.push(...links);
    }
  }

  for (const link of galleryFilePages) {
    const file = await getGalleryFile(link);
    filelist.files.push(file);
  }

  return filelist;
}

export class BunkrAPI implements ProviderAPI {
  public testURL(url: URL) {
    return /bunkr/.test(url.origin);
  }

  public async getData(url: string): Promise<CoomerFileList> {
    const _url = new URL(url);
    _url.searchParams.set('advanced', '1');
    const filelist = await getGalleryFiles(_url.toString());
    return filelist;
  }
}
