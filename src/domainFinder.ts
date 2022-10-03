// DomainFinder finds all the domains in a url.
export class DomainFinder {
  private readonly url: URL

  /**
   * Creates a new DomainFinder.
   * @param url - The url to find domains in.
   */
  constructor(url: string) {
    this.url = new URL(url)
  }

  /*
   * Returns the domains in the url.
   * @returns {Array<string>} An array of domains.
   */
  get domains() {
    let domain = this.url.hostname

    const domains = new Set<string>()

    domains.add(domain)

    let indexOfDot = domain.indexOf('.')

    while (indexOfDot > -1) {
      domain = domain.substring(indexOfDot + 1)
      domains.add(domain)
      indexOfDot = domain.indexOf('.')
    }

    return Array.from(domains)
  }
}
