// ContentFinder takes a bunch of content and searches for terms that can
// be one or more words.
export class ContentFinder {
  private readonly MAX_PHRASE_LENGTH = 5

  private readonly IGNORED_WORDS = new Set<string>(['.', ','])

  private dictionary: Set<string>

  /**
   * Initializes a new instance of the ContentFinder class.
   * @param dictionary - The dictionary of terms to search for in the content.
   */
  constructor(dictionary: Set<string>) {
    this.dictionary = dictionary
  }

  /**
   * Finds matching content in a dictionary of words in the content provided
   * @param content - The content to search for matching content in.
   * @returns {Array<string>} An array of matching content.
   */
  findContent(content: Array<string>) {
    let foundContent = new Set<string>()

    let currentWords = Array<string>()

    for (let word of content) {
      if (this.IGNORED_WORDS.has(word)) {
        continue
      }

      currentWords.push(
        word
          .replaceAll(',', '')
          .replaceAll('.', '')
          .replaceAll(';', '')
          .replaceAll(':', '')
          .replaceAll('!', '')
          .replaceAll('?', '')
          .replaceAll('"', '')
          .replaceAll("'", '')
      )

      if (currentWords.length > this.MAX_PHRASE_LENGTH) {
        currentWords.shift()
      }

      for (let i = 0; i < currentWords.length; i++) {
        const phrase = currentWords.slice(i).join(' ')

        if (this.dictionary.has(phrase)) {
          foundContent.add(phrase)
        }
      }
    }

    return Array.from(foundContent)
  }
}
