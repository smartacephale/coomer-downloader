export type MediaType = 'video' | 'image';

export type DownloaderEvent = {
  type:
    | 'DOWNLOAD_STARTED'
    | 'DOWNLOAD_FINISHED'
    | 'FILE_STARTED'
    | 'FILE_FINISHED'
    | 'CHUNK_STARTED'
    | 'CHUNK_UPDATED'
    | 'CHUNK_FINISHED';
};

export type AbortControllerEvent = 'FILE_SKIP' | 'TIMEOUT';
