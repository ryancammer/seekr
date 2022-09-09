export class CrawlableLink {
  private readonly url: URL

  readonly NullURL = new URL('https://null')

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

  get hostname() {
    return new URL(this.url).hostname
  }

  get crawlableUrl() {
    return new URL(this.url).toString()
  }
}
