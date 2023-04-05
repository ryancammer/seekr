import { describe, expect, test } from '@jest/globals'
import { Crawler } from '../../src'

describe('Crawler', () => {
  describe('enqueueCrawl', () => {
    test('crawls a site', async () => {
      let results = new Array<string>()

      let resultCallback = (result: any) => {
        results.push(result)
      }

      const crawler = new Crawler(['dfinity'], false, false, resultCallback)

      await crawler.init()
      crawler.enqueueCrawl('https://dfinity.org/')

      await new Promise(f => setTimeout(f, 2000));

      await crawler.close()

      expect(results.length).toEqual(1)
    })
  })
})
