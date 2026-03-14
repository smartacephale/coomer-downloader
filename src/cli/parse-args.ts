import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export function parseArgs() {
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
      description: 'Filter files by media type',
    })
    .option('include', {
      type: 'string',
      default: '',
      description:
        'Positive filter by file title, takes comma-separated list of keywords or RegExp',
    })
    .option('exclude', {
      type: 'string',
      default: '',
      description:
        'Negative filter by file title, takes comma-separated list of keywords or RegExp',
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
