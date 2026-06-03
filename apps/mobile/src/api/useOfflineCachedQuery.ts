import {
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  useQuery,
} from '@tanstack/react-query'

import { readOfflineCache, writeOfflineCache } from '../offline/cache'
import {
  isAuthExpiredError,
  isLikelyNetworkError,
  setOfflineStatus,
} from '../offline/store'

type OfflineCachedQueryOptions<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryFn'> & {
  queryFn: QueryFunction<TQueryFnData, TQueryKey>
  cacheKey: string
}

export function useOfflineCachedQuery<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>({
  cacheKey,
  ...options
}: OfflineCachedQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  return useQuery({
    ...options,
    retry: false,
    queryFn: async (context) => {
      try {
        const data = await options.queryFn(context)
        await writeOfflineCache(cacheKey, data)
        setOfflineStatus(false)
        return data
      } catch (error) {
        const isNetworkError = isLikelyNetworkError(error)
        const canUseCachedData = isNetworkError || isAuthExpiredError(error)

        if (canUseCachedData) {
          if (isNetworkError) {
            setOfflineStatus(true)
          }

          const cached = await readOfflineCache<TQueryFnData>(cacheKey)
          if (cached) {
            return cached.data
          }
        }

        throw error
      }
    },
  })
}

