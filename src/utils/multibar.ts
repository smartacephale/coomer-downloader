import { MultiBar, type SingleBar } from 'cli-progress';
import { subject } from './downloader';
import { b2mb, formatNameStdout } from './strings';

const config = {
  clearOnComplete: true,
  gracefulExit: true,
  autopadding: true,
  hideCursor: true,
  format: '{percentage}% | {filename} | {value}/{total}{size}',
};

// interface IBarState {
//   totalFiles: number;
//   totalDownloadedFiles: number;
//   filesInProcess: File[];
// }

export function createMultibar() {
  const multibar = new MultiBar(config);
  let bar: SingleBar;
  let minibar: SingleBar;
  let filename: string;

  subject.subscribe({
    next: ({ type, filesCount, index, file }) => {
      switch (type) {
        case 'FILES_DOWNLOADING_STARTED':
          bar?.stop();
          bar = multibar.create(filesCount as number, 0);
          break;

        case 'FILES_DOWNLOADING_FINISHED':
          bar?.stop();
          break;

        case 'FILE_DOWNLOADING_STARTED':
          bar?.update((index as number) + 1, { filename: 'Downloaded files', size: '' });
          break;

        case 'CHUNK_DOWNLOADING_STARTED':
          multibar?.remove(minibar);
          filename = formatNameStdout(file?.filepath as string);
          minibar = multibar.create(b2mb(file?.size as number), b2mb(file?.downloaded as number));
          break;

        case 'FILE_DOWNLOADING_FINISHED':
          multibar.remove(minibar);
          break;

        case 'CHUNK_DOWNLOADING_UPDATE':
          minibar?.update(b2mb(file?.downloaded as number), {
            filename: filename as string,
            size: 'mb',
          });
          break;

        default:
          break;
      }
    },
  });
}
