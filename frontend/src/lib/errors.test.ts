import { describe, expect, it } from 'vitest'
import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('uses the message of an ordinary error', () => {
    expect(getErrorMessage(new Error('Ticket not found.'))).toBe(
      'Ticket not found.',
    )
  })

  it('explains a network failure in plain words', () => {
    expect(getErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Could not reach the server. Check your connection and try again.',
    )
  })

  it('has a fallback for anything else', () => {
    expect(getErrorMessage('boom')).toBe(
      'Something went wrong. Please try again.',
    )
    expect(getErrorMessage(new Error(''))).toBe(
      'Something went wrong. Please try again.',
    )
  })
})
