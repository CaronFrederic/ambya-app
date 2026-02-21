import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './fetcher'

export type CountryItem = { code: string; name: string; currency: string }

export function useCountries() {
  return useQuery({
    queryKey: ['config', 'countries'],
    queryFn: async () => {
      const res = await apiFetch<{ items: CountryItem[] }>('config/countries')
      return res.items
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
  })
}
