import type { ApiResult } from '../types';

export async function getPlainFileData(url: string): Promise<ApiResult> {
  return {
    dirName: '',
    files: [
      {
        name: url.split('/').pop() as string,
        url,
      },
    ],
  };
}
