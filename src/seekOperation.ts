import { existsSync, readFileSync } from 'fs'
import { Crawler } from './crawler'
import { WordExpansion } from './wordExpansion'
import { InternetComputer } from './internetComputer'

// SeekOperation is an operation that seeks words in pages from a page source
// such as the Internet Computer.
export class SeekOperation {
  public static readonly DefaultBreakAfter = 1000000

  private readonly options: any
  private crawler: Crawler | null

  /**
   * Initializes a new instance of the SeekOperation class.
   * @param options - The options for the operation. These come from the command line.
   */
  constructor(options: any) {
    this.options = options
    this.crawler = null
  }

  get isFinished() {
    return this.crawler?.isFinished
  }

  /**
   * Executes the Seek operation.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async perform(
    resultCallback: any = console.log,
    breakAfter: number = SeekOperation.DefaultBreakAfter
  ) {
    const words = readFileSync(this.options.wordFile, 'utf-8')
      .split('\n')
      .filter((w) => w.length > 0)

    const dictionary = new Set<string>(words)

    if (!this.options.stifleExpansion) {
      const wordExpansion = new WordExpansion()
      words.forEach((word: string) => {
        wordExpansion.expand(word).forEach((expandedWord: string) => {
          dictionary.add(expandedWord)
        })
      })
    }

    if (existsSync(this.options.excludedWordsFile)) {
      const excludedWords = readFileSync(
        this.options.excludedWordsFile,
        'utf-8'
      )
        .split('\n')
        .filter((w) => w.length > 0)

      excludedWords.forEach((word: string) => {
        dictionary.delete(word)
      })
    }

    let interestingDomains: Array<string> = []

    if (existsSync(this.options.interestingDomainsFile)) {
      interestingDomains = readFileSync(
        this.options.interestingDomainsFile,
        'utf-8'
      )
        .split('\n')
        .filter((w) => w.length > 0)
    }

    this.crawler = new Crawler(
      dictionary,
      this.options.debug,
      resultCallback,
      Crawler.DefaultSimultaneousRequests,
      Crawler.DefaultRequestTimeout,
      interestingDomains
    )
    await this.crawler.init()

    const internetComputer = new InternetComputer()

    await internetComputer.fetchAll(
      this.crawler.enqueueCrawl.bind(this.crawler),
      breakAfter
    )
  }
}
