import { lazy, Suspense } from 'react'

// Only import devtools in development - Vite will tree-shake this in production
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((mod) => ({
        default: mod.ReactQueryDevtools,
      }))
    )
  : null

export function DevTools() {
  if (!ReactQueryDevtools) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <ReactQueryDevtools initialIsOpen={false} />
    </Suspense>
  )
}
