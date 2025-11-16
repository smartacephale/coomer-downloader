import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export type ArgumentHandlerResult = {
  [x: string]: unknown;
  url: string;
  dir: string;
  media: string;
  include: string;
  exclude: string;
  skip: number;
  _: (string | number)[];
  $0: string;
};

export function argumentHander(): ArgumentHandlerResult {
  return yargs(hideBin(process.argv))
    .option('url', {
      alias: 'u',
      type: 'string',
      description:
        'A URL from Coomer/Kemono/Bunkr/GoFile, a Reddit user (u/<username>), or a direct file link',
      demandOption: true,
    })
    .option('dir', {
      type: 'string',
      description: 'The directory where files will be downloaded',
      default: './',
    })
    .option('media', {
      type: 'string',
      choices: ['video', 'image', 'all'],
      default: 'all',
      description:
        "The type of media to download: 'video', 'image', or 'all'. 'all' is the default.",
    })
    .option('include', {
      type: 'string',
      default: '',
      description: 'Filter file names by a comma-separated list of keywords to include',
    })
    .option('exclude', {
      type: 'string',
      default: '',
      description: 'Filter file names by a comma-separated list of keywords to exclude',
    })
    .option('skip', {
      type: 'number',
      default: 0,
      description: 'Skips the first N files in the download queue',
    })
    .help()
    .alias('help', 'h')
    .parseSync();
}
