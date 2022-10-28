import axios from 'axios'
import axiosThrottle from 'axios-request-throttle'

// The InternetComputer is a wrapper around the Internet Computer's
// Index API. It provides methods for reading canister metadata from
// the index.
export class InternetComputer {
  public static readonly DefaultBaseUrl =
    'https://ic-api.internetcomputer.org/api/v3/canisters'

  public static readonly DefaultLimit = 100

  public static readonly DefaultSimultaneousRequestsPerSecond = 10

  public static readonly DefaultMaximumNumberOfPages = 1000000

  private readonly baseUrl: string
  private readonly limit: number
  private readonly simultaneousRequestsPerSecond: number
  private _startTime: number = 0
  private _canistersProcessed: number = 0
  private readonly fastForward: string | null
  private _totalCanisters: number
  private readonly debug: boolean
  private readonly out: any

  /**
   * Initializes a new instance of the InternetComputer class.
   */
  constructor(
    baseUrl = InternetComputer.DefaultBaseUrl,
    limit = InternetComputer.DefaultLimit,
    simultaneousRequestsPerSecond = InternetComputer.DefaultSimultaneousRequestsPerSecond,
    fastForward = null,
    debug = false,
    out = console.log
  ) {
    this.baseUrl = baseUrl
    this.limit = limit
    this.simultaneousRequestsPerSecond = simultaneousRequestsPerSecond
    this.fastForward = fastForward
    this._totalCanisters = 0
    this.debug = debug
    this.out = out

    axiosThrottle.use(axios, {
      requestsPerSecond: this.simultaneousRequestsPerSecond
    })
  }

  /**
   * Fetches the total number of canisters from the Internet Computer index.
   * @returns {Promise<number>} A promise that resolves to the total number of canisters.
   */
  async totalNumberOfCanisters() {
    if (this._totalCanisters === 0) {
      const page = await axios.get(`${this.baseUrl}?limit=0`)
      this._totalCanisters = page.data.total_canisters
    }

    return this._totalCanisters
  }

  /**
   * Gets the number of canisters processed.
   */
  get canistersProcessed() {
    return this._canistersProcessed
  }

  /**
   * Gets the percentage of canisters processed.
   */
  get percentComplete() {
    return Math.round((this.canistersProcessed / this._totalCanisters) * 100)
  }

  /**
   * Gets the total time elapsed since the start of the fetch.
   */
  get totalTime() {
    return ((performance.now() - this._startTime) / 1000).toFixed(2)
  }

  /**
   * Fetches the canister ids from the given canister index page.
   * @returns {Promise<*>} A promise that resolves to an array of canister ids.
   * @param pageNumber - The page number to fetch.
   */
  async fetchCanisterMetadata(pageNumber: number) {
    const url = `${this.baseUrl}?offset=${pageNumber * this.limit}&limit=${
      this.limit
    }`

    const page = await axios.get(url)
    return page.data.data
  }

  /**
   * Gets the total number of pages.
   */
  async getTotalPages() {
    const totalCanisters = await this.totalNumberOfCanisters()

    return Math.ceil(totalCanisters / this.limit)
  }

  /**
   * Fetches the canister metadata from Internet Computer index.
   * @returns {Promise<void>} A promise that resolves when the metadata is fetched.
   */
  async fetchAll(
    callback: any,
    stopAfter: number = InternetComputer.DefaultMaximumNumberOfPages
  ) {
    const pages = await this.getTotalPages()

    this._startTime = performance.now()

    let continueFetching = true

    for (const pageNumber of Array.from(Array(pages).keys())) {
      const canisterMetadata = await this.fetchCanisterMetadata(pageNumber)

      if (!continueFetching) {
        break
      }

      for (const canisterId of canisterMetadata.map(
        (canister: any) => canister.canister_id
      )) {
        if (!continueFetching) {
          continue
        }

        if (!this.fastForward || canisterId > this.fastForward) {
          axios
            .head(`https://${canisterId}.raw.ic0.app`)
            .then((response) => {
              if (response.status === 200) {
                callback(`https://${canisterId}.raw.ic0.app`)
              }
            })
            .catch((_error) => {
              //
            })
        } else {
          if (this.debug) {
            this.out(`Skipping canister ${canisterId}`)
          }
        }

        this._canistersProcessed++

        const processed = this._canistersProcessed

        if (this.debug && this.canistersProcessed % 1000 === 0) {
          const totalCanisters = await this.totalNumberOfCanisters()

          this.out(
            `Processed ${processed} of ${totalCanisters} canisters in ${this.totalTime} s. ${this.percentComplete}% complete.`
          )
        }

        if (processed >= stopAfter) {
          continueFetching = false
        }
      }
    }
  }
}
