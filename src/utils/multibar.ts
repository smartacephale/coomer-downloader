import { MultiBar, type Options, type SingleBar } from 'cli-progress';
import { subject } from './downloader';
import { b2mb, formatNameStdout } from './strings';

const config: Options = {
  clearOnComplete: true,
  gracefulExit: true,
  autopadding: true,
  hideCursor: true,
  format: '{percentage}% | {filename} | {value}/{total}{size}',
};

export function createMultibar() {
  const multibar = new MultiBar(config);
  let bar: SingleBar;
  let minibar: SingleBar;
  let filename: string;
  let index = 0;

  subject.subscribe({
    next: ({ type, filesCount, file }) => {
      switch (type) {
        case 'FILES_DOWNLOADING_START':
          bar?.stop();
          bar = multibar.create(filesCount as number, 0);
          break;

        case 'FILES_DOWNLOADING_END':
          bar?.stop();
          break;

        case 'FILE_DOWNLOADING_START':
          bar?.update(++index, { filename: 'Downloaded files', size: '' });
          break;

        case 'FILE_DOWNLOADING_END':
          multibar.remove(minibar);
          break;

        case 'CHUNK_DOWNLOADING_START':
          multibar?.remove(minibar);
          filename = formatNameStdout(file?.filepath as string);
          minibar = multibar.create(b2mb(file?.size as number), b2mb(file?.downloaded as number));
          break;

        case 'CHUNK_DOWNLOADING_UPDATE':
          minibar?.update(b2mb(file?.downloaded as number), {
            filename: filename as string,
            size: 'mb',
          });
          break;

        case 'CHUNK_DOWNLOADING_END':
          multibar?.remove(minibar);
          break;

        default:
          break;
      }
    },
  });
}
