export async function getPlainFileData(url) {
  return {
    dirName: '',
    files: [
      {
        name: url.split('/').pop(),
        src: url,
      },
    ],
  };
}
