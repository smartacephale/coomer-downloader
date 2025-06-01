import { fetch, testMediaType } from './../utils/index.js';

async function getToken() {
  const response = await fetch('https://api.gofile.io/accounts', {
    method: 'POST',
  });
  const data = await response.json();
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

async function getFolderFiles(id, token, websiteToken) {
  const url = `https://api.gofile.io/contents/${id}?wt=${websiteToken}&cache=true}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const files = Object.values(data.data.children).map((f) => ({
    src: f.link,
    name: f.name,
  }));

  return files;
}

export async function getGofileData(url, mediaType) {
  const id = url.match(/gofile.io\/d\/(\w+)/)[1];
  const dirName = `gofile-${id}`;

  const token = await getToken();
  const websiteToken = await getWebsiteToken();

  const files = await getFolderFiles(id, token, websiteToken);

  return {
    dirName,
    files: files.filter((f) => testMediaType(f.name, mediaType)),
    headerData: { Cookie: `accountToken=${token}` },
  };
}
