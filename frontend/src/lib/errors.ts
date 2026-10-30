/** Turn anything that was thrown into a sentence a person can act on. */
export function getErrorMessage(error: unknown): string {
  // fetch() throws a TypeError when the server cannot be reached at all.
  if (error instanceof TypeError) {
    return 'Could not reach the server. Check your connection and try again.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong. Please try again.'
}
