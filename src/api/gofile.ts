import { fetch } from 'undici';
import { CoomerFile } from '../services/file';
import { CoomerFileList } from '../services/filelist';
import { setGlobalHeaders } from '../utils/requests';

type GoFileAPIToken = { status: string; data: { token: string } };
type GoFileAPIFilelist = { data: { children: { link: string; name: string }[] } };

async function getToken(): Promise<string> {
  const response = await fetch('https://api.gofile.io/accounts', {
    method: 'POST',
  });
  const data = (await response.json()) as GoFileAPIToken;
  if (data.status === 'ok') {
    return data.data.token;
  }
  throw new Error('cannot get token');
}

async function getWebsiteToken() {
  const response = await fetch('https://gofile.io/dist/js/global.js');
  const alljs = await response.text();
  const match = alljs.match(/appdata\.wt = "([^"]+)"/);
  if (match?.[1]) {
    return match[1];
  }
  throw new Error('cannot get wt');
}

async function getFolderFiles(
  id: string,
  token: string,
  websiteToken: string,
): Promise<CoomerFileList> {
  const url = `https://api.gofile.io/contents/${id}?wt=${websiteToken}&cache=true}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as GoFileAPIFilelist;
  const files = Object.values(data.data.children).map((f) =>
    CoomerFile.from({
      url: f.link,
      name: f.name,
    }),
  );

  return new CoomerFileList(files);
}

export async function getGofileData(url: string): Promise<CoomerFileList> {
  const id = url.match(/gofile.io\/d\/(\w+)/)?.[1] as string;

  const token = await getToken();
  const websiteToken = await getWebsiteToken();

  const filelist = await getFolderFiles(id, token, websiteToken);
  filelist.dirName = `gofile-${id}`;

  setGlobalHeaders({ Cookie: `accountToken=${token}` });

  return filelist;
}
