import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export function argumentHander() {
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
      choices: ['video', 'image'],
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
    .option('min-size', {
      type: 'string',
      default: '',
      description: 'Minimum file size to download. Example: "1mb" or "500kb"',
    })
    .option('max-size', {
      type: 'string',
      default: '',
      description: 'Maximum file size to download. Example: "1mb" or "500kb"',
    })
    .option('skip', {
      type: 'number',
      default: 0,
      description: 'Skips the first N files in the download queue',
    })
    .option('remove-dupilicates', {
      type: 'boolean',
      default: true,
      description: 'removes duplicates by url and file hash',
    })
    .help()
    .alias('help', 'h')
    .parseSync();
}
