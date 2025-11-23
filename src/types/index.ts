export type MediaType = 'video' | 'image' | 'all';

export type DownloaderSubjectSignal =
  | 'FILES_DOWNLOADING_START'
  | 'FILES_DOWNLOADING_END'
  | 'FILE_DOWNLOADING_START'
  | 'FILE_DOWNLOADING_END'
  | 'FILE_SKIP'
  | 'CHUNK_DOWNLOADING_START'
  | 'CHUNK_DOWNLOADING_UPDATE'
  | 'CHUNK_DOWNLOADING_END';

export type DownloaderSubject = {
  type: DownloaderSubjectSignal;
};
