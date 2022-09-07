const axios = require('axios')
const fs = require('fs')
const {Command} = require('commander')
const puppeteer = require('puppeteer')
const axiosThrottle = require('axios-request-throttle')
const async = require('async')

// The Crawler crawls for content using Puppeteer to load urls into
// a DOM, and then searches the DOM's content to see if any of it
// matches what's in the dictionary. If it does, it outputs the
// url and the matching content.
class Crawler {
  /**
   * Initializes a new instance of the Crawler class.
   * @constructor
   * @param {Dictionary} dictionary - The dictionary of content to search for.
   * @param {boolean} debug - True to enable debug logging.
   */
  constructor(dictionary, debug = false) {
    this.dictionary = dictionary
    this.browser = null
    this.counter = 0
    this.startTime = null
    this.simultaneousRequests = 10
    this.requestTimeout = 10000
    this.debug = debug
  }

  /**
   * Initializes the crawler by creating a new browser instance.
   * @returns {Promise<void>} A promise that resolves when the browser is ready.
   */
  async init() {
    if (this.debug) {
      console.debug('Initializing crawler')
    }

    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    this.urlQueue = async.queue(async (task, callback) => {
      const self = this;
      await self.performCrawl(task, callback)
    }, this.simultaneousRequests)

    this.urlQueue.drain(async () => {
      if (this.debug) {
        console.debug('Queue drained')
      }
      await this.close()
    })
  }

  /**
   * Performs a crawl for the given url.
   * @param url
   * @param callback
   * @returns {Promise<void>} A promise that resolves when the crawl is complete.
   */
  async performCrawl(url, callback) {
    this.counter++

    if (this.debug && this.counter % 1000 === 0) {
      console.debug(`Processed ${this.counter} pages in ${(performance.now() - this.startTime) / 1000}s.`)
    }

    let result = null;

    try {
      let page = await this.browser.newPage()

      await page.goto(url, {timeout: this.requestTimeout, waitUntil: 'domcontentloaded'})

      const content = await page.content()
      const words = content.split(' ').map(word => word.toLowerCase())
      const hrefs = await page.$$eval('a', as => as.map(a => a.href))

      let found = {}

      words.forEach(word => {
        if (this.dictionary.has(word)) {
          found[word] = true
        }
      });

      if (Object.keys(found).length > 0) {
        result = {found: true, url: url, words: Object.keys(found).join(',')}
        console.log(`${url},${Object.keys(found).join(',')}`)
      } else {
        result = {found: true, url: url, words: Object.keys(found).join(',')}
      }
    } catch (err) {
      result = {found: false, url: url, error: err}
      if (this.debug) {
        console.debug(`Error crawling ${url}: ${err.toString()}`)
      }
    } finally {
      await page.close()
    }

    if (callback) {
      callback(result)
    }
  }

  /**
   * Closes the crawler by closing the browser instance.
   * @returns {Promise<void>} A promise that resolves when the browser is closed.
   */
  async close() {
    if (this.debug) {
      console.debug(`Closing browser. Queue length: ${this.urlQueue.length()}`)
    }
    await this.browser.close()
  }

  /**
   * Adds a url to the queue to be crawled.
   * @param url - The url to crawl.
   */
  enqueueCrawl(url) {
    this.urlQueue.push(url)
  }
}

// The InternetComputer is a wrapper around the Internet Computer's
// Index API. It provides methods for reading canister metadata from
// the index.
class InternetComputer {
  /**
   * Initializes a new instance of the InternetComputer class.
   * @param crawler - The crawler to use for crawling canisters.
   */
  constructor(crawler) {
    this.startingUrl = 'https://ic-api.internetcomputer.org/api/v3/canisters?offset=0&limit=0'
    this.limit = 100
    this.simultaneousRequestsPerSecond = 2
    this.crawler = crawler

    axiosThrottle.use(axios, {requestsPerSecond: this.simultaneousRequestsPerSecond})
  }

  /**
   * Fetches the canister ids from the given canister index page.
   * @param url - The url of the canister index page.
   * @returns {Promise<*>} A promise that resolves to an array of canister ids.
   */
  async fetchCanisterIds(url) {
    const page = await axios.get(url)
    return page.data.data.map(canister => canister.canister_id)
  }

  /**
   * Fetches the canister metadata from Internet Computer index.
   * @returns {Promise<void>} A promise that resolves when the metadata is fetched.
   */
  async fetchAll() {
    const startingPage = await axios.get(this.startingUrl)
    const pages = Math.ceil(startingPage.data.total_canisters / 100)

    const canisterIndexPages = [...Array(pages).keys()].map(
      pageNumber => `https://ic-api.internetcomputer.org/api/v3/canisters?offset=${pageNumber * this.limit}&limit=${this.limit}`
    )

    canisterIndexPages.forEach(await (async canisterIndexPage => {
      const canisterIds = await this.fetchCanisterIds(canisterIndexPage)

      canisterIds.forEach(canisterId => {
        this.crawler.enqueueCrawl(`https://${canisterId}.raw.ic0.app`)
      })
    }))
  }
}

// WordExpansion expands a word into its additions, substitutions, transpositions,
// replacements, and deletions.
class WordExpansion {
  /**
   * Expands the given word into its additions, substitutions, transpositions,
   * replacements, and deletions.
   * @param word - The word to expand.
   * @returns {unknown[]} An array of expanded words.
   */
  expand(word) {
    const pairify = (w, i) => [w.slice(0, i), w.slice(i)]
    const splitter = word => Array(word.length + 1).fill(word).map(pairify)
    const _byLength = len => ([a, b]) => b.length > len
    let ALPHABETS = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('')

    let flatten = ary => Array.prototype.concat(...ary)

    let pairs = splitter(word)

    let deletes = pairs
      .filter(_byLength(0))
      .map(([a, b]) => a + b.slice(1))

    let transposes = pairs
      .filter(_byLength(1))
      .map(([a, b]) => a + b[1] + b[0] + b.slice(2))

    let replaces = flatten(
      pairs
        .map(([a, b]) => ALPHABETS.map(c => a + c + b.slice(1)))
    )

    let inserts = flatten(
      pairs
        .map(([a, b]) => ALPHABETS.map(c => a + c + b))
    )

    return Array.from(
      new Set(deletes.concat(transposes).concat(replaces).concat(inserts))
    )
  }
}

// Dictionary is a wrapper around a set of words that are read from a file, and can include
// all the additions, substitutions, transpositions, replacements, and deletions of each
// word in the file.
class Dictionary {
  /**
   * Initializes a new instance of the Dictionary class.
   * @param dictionaryPath - The path to the dictionary file.
   * @param expand - Whether to expand the dictionary for each word to
   * include all the additions, transpositions, replacements, substitutions, and deletions
   */
  constructor(dictionaryPath, expand) {
    this.words = new Set()

    const wordExpansion = new WordExpansion()

    fs.readFileSync(dictionaryPath, 'utf-8').split('\n').forEach(word => {
      this.words.add(word)

      if (expand) {
        wordExpansion.expand(word).forEach(expandedWord => {
          this.words.add(expandedWord)
        })
      }
    })
  }

  /**
   * Returns all words in the dictionary.
   * @returns {*} All of the words in the dictionary.
   */
  all() {
    return this.words
  }

  /**
   * Returns whether the given word is in the dictionary.
   * @param word
   * @returns {boolean}
   */
  has(word) {
    return this.words.has(word)
  }
}

// SeekOperation is an operation that seeks words in pages from a page source
// such as the Internet Computer.
/** SeekOperation description */
class SeekOperation {
  /**
   * Initializes a new instance of the SeekOperation class.
   * @param options - The options for the operation. These come from the command line.
   */
  constructor(options) {
    this.options = options
  }

  /**
   * Executes the Seek operation.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async perform() {
    const dictionary = new Dictionary(
      this.options.wordFile,
      !this.options.stifleExpansion
    )

    const crawler = new Crawler(dictionary, this.options.debug)
    await crawler.init()
    const internetComputer = new InternetComputer(crawler)
    await internetComputer.fetchAll(crawler)
  }
}

// The Seekr main class. This is the entry point for the application.
class Seekr {
  constructor() {
    this.packageInfo = JSON.parse(fs.readFileSync('package.json'));
  }

  /**
   * Runs the Seekr application.
   * @returns {Promise<void>} A promise that resolves when the application is complete.
   */
  async run() {
    const program = new Command();

    program
      .name(this.packageInfo.name)
      .description(this.packageInfo.description)
      .version(this.packageInfo.version)

    program
      .command('seek')
      .description('Seek canisters that contain words from the dictionary')
      .option('-w, --word-file', 'The file with all of the words to seek', 'dictionary.txt')
      .option('-s, --source', 'The source of pages to seek', 'internet-computer')
      .option('-d, --debug', 'Whether to debug', false)
      .option('-X, --stifle-expansion', 'Whether to not expand the dictionary', false)
      .action(async (options) => {
          await new SeekOperation(options).perform()
        }
      )
    ;

    await program.parse()
  }
}

(async () => {
  await new Seekr().run()
})()

