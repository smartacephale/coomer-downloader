import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export function argumentHander() {
  return yargs(hideBin(process.argv))
    .option('url', {
      alias: 'u',
      type: 'string',
      description: 'Coomer/Kemono/Bunkr URL, u/<reddit-username> or any direct file url',
      demandOption: true,
    })
    .option('dir', {
      type: 'string',
      description: 'Directory to download files to',
      default: './',
    })
    .option('media', {
      type: 'string',
      choices: ['video', 'image', 'all'],
      default: 'all',
      description:
        "Download media type: 'video', 'image', or 'all', 'all' is default",
    })
    .help()
    .alias('help', 'h').argv;
}
