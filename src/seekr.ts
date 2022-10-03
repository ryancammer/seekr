import packageInfo from '../package.json'
import { Command } from 'commander'
import { SeekOperation } from './seekOperation'

// The Seekr main class. This is the entry point for the application.
export class Seekr {
  private packageInfo: any
  constructor() {
    this.packageInfo = packageInfo
  }

  /**
   * Runs the Seekr application.
   * @returns {Promise<void>} A promise that resolves when the application is complete.
   */
  async run() {
    const program = new Command()

    program
      .name(this.packageInfo.name)
      .description(this.packageInfo.description)
      .version(this.packageInfo.version)

    program
      .command('seek')
      .description('Seek canisters that contain words from the dictionary')
      .option(
        '-f, --fast-forward <fastForward>',
        'Fast forward to the canister id that comes after the number or letter',
        ''
      )
      .option(
        '-i, --interesting-domains-file <interestingDomainsFile>',
        'The file with a list of interesting domains that should be crawled',
        'interesting_domains.txt'
      )
      .option(
        '-w, --word-file <wordFile>',
        'The file with all of the words to seek',
        'dictionary.txt'
      )
      .option(
        '-x, --excluded-words-file <excludedWordsFile>',
        'The file with a list of words to exclude from the dictionary',
        'excluded_words.txt'
      )
      .option(
        '-s, --source <source>',
        'The source of pages to seek',
        'internet-computer'
      )
      .option('-d, --debug', 'Whether to debug', false)
      .option(
        '-X, --stifle-expansion',
        'Whether to not expand the dictionary',
        false
      )
      .option(
        '-p, --pictures',
        'Whether to take pictures of the canisters that are found to have one or more words',
        false
      )
      .action(async (options) => {
        await new SeekOperation(options).perform()
      })

    await program.parse()
  }
}
