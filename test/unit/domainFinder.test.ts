import { describe, expect, test } from '@jest/globals'
import { DomainFinder } from '../../src/domainFinder'

describe('DomainFinder', () => {
  describe('#domains', () => {
    describe('when there are multiple domains', () => {
      test('it returns the domains', () => {
        const link =
          'https://www.bscscan.com/address/0x8a9c67fee641579deba04928c4bc45f66e26343a'

        expect(new DomainFinder(link).domains).toEqual([
          'www.bscscan.com',
          'bscscan.com',
          'com'
        ])
      })
    })
  })
})
