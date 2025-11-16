export type File = {
  name: string;
  url: string;
  filepath?: string;
  size?: number;
  downloaded?: number;
  content?: string;
};

export type DownloaderSubject = {
  type: string;
  file?: File;
  index?: number;
  filesCount?: number;
};

export type ApiResult = {
  files: File[];
  // should merge into filepaths?
  dirName: string;
};

export type MediaType = 'video' | 'image' | 'all';
