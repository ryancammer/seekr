// A CrawlableLink is a link that can be crawled.
// It is not an image, a mailto or a tel link.
export class CrawlableLink {
  private readonly url: URL

  readonly NullURL = new URL('https://null')

  /**
   * Creates a new CrawlableLink.
   * @param url - The url to check.
   */
  constructor(url: string) {
    try {
      this.url = new URL(url)
    } catch (e) {
      this.url = this.NullURL
    }
  }

  private isImage() {
    const regex =
      '^(?:(?<scheme>[^:\\/?#]+):)?(?:\\/\\/(?<authority>[^\\/?#]*))?(?<path>[^?#]*\\/)?(?<file>[^?#]*\\.(?<extension>[Jj][Pp][Ee]?[Gg]|[Pp][Nn][Gg]|[Gg][Ii][Ff]))(?:\\?(?<query>[^#]*))?(?:#(?<fragment>.*))?$'

    const match = this.url.toString().match(regex)

    return match?.groups?.extension !== undefined
  }

  private isMailto() {
    return this.url.protocol.startsWith('mailto:')
  }

  private isTel() {
    return this.url.protocol.startsWith('tel:')
  }

  private isHttp() {
    return this.url.protocol == 'http:' || this.url.protocol == 'https:'
  }

  private isPdf() {
    return new URL(this.url).pathname.endsWith('.pdf')
  }

  /**
   * Returns true if the link is crawlable.
   */
  get isCrawlable() {
    if (this.url == this.NullURL) {
      return false
    }

    if (this.isImage()) {
      return false
    }

    if (this.isMailto()) {
      return false
    }

    if (this.isTel()) {
      return false
    }

    if (this.isPdf()) {
      return false
    }

    return this.isHttp()
  }

  /**
   * Returns the url's hostname.
   * @returns {string} The hostname.
   */
  get hostname() {
    return new URL(this.url).hostname
  }

  /**
   * Returns the url.
   */
  get crawlableUrl() {
    return new URL(this.url).toString()
  }

  /**
   * Returns an array of urls that are crawlable from the links.
   * @param links - The links to check.
   * @returns {Array<CrawlableLink>} An array of crawlable urls.
   */
  static crawlableLinks(links: string[]): Array<CrawlableLink> {
    return links
      .map((link: string) => new CrawlableLink(link))
      .filter((link: CrawlableLink) => link.isCrawlable)
  }
}
