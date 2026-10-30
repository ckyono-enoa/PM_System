import { QueryClient } from '@tanstack/react-query'

/** The defaults every server-data query and mutation starts from. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data counts as fresh for 30 seconds, so moving between screens does not refetch every time.
        staleTime: 30_000,
        // One quiet retry covers a brief network blip. After that, show the error.
        retry: 1,
      },
      // Never repeat a write automatically: it could be applied twice.
      mutations: { retry: 0 },
    },
  })
}
