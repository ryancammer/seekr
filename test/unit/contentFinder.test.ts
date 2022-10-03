import { describe, expect, test } from '@jest/globals'
import { ContentFinder } from '../../src/contentFinder'

describe('ContentFinder', () => {
  describe('findContent', () => {
    test('finds multi-word phrases', async () => {
      let dictionary = new Set<string>()
      dictionary.add('hello world')
      dictionary.add('i see you')

      const content = ['hello', 'world', '.', 'i', 'see', 'you']

      const contentFinder = new ContentFinder(dictionary)

      const foundContent = contentFinder.findContent(content)

      expect(foundContent).toEqual(['hello world', 'i see you'])
    })
  })
})
