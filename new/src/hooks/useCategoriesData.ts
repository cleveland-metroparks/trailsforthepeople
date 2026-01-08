import { useQuery } from '@tanstack/react-query'
import { getCategories } from '../lib/api'
import type { Category } from '../types/api'

/**
 * Hook to get categories data
 * Returns categories as a map keyed by categorytypeid for easy lookup
 */
export function useCategoriesData() {
  const categoriesQuery = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  })

  // Create a map for easy lookup by categorytypeid
  const categoriesMap = categoriesQuery.data
    ? categoriesQuery.data.reduce<Record<number, string>>((acc, category) => {
        acc[category.categorytypeid] = category.name
        return acc
      }, {})
    : {}

  return {
    categories: categoriesQuery.data ?? [],
    categoriesMap,
    isLoading: categoriesQuery.isLoading,
    isError: categoriesQuery.isError,
    error: categoriesQuery.error,
  }
}
