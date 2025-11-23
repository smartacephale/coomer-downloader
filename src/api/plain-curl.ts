import { CoomerFile, CoomerFileList } from '../services/file';

export async function getPlainFileData(url: string): Promise<CoomerFileList> {
  const name = url.split('/').pop() as string;
  const file = CoomerFile.from({ name, url });
  const filelist = new CoomerFileList([file]);
  filelist.dirName = '';
  return filelist;
}
