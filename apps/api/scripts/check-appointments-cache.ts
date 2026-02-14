import { QueryClient } from '@tanstack/query-core'

async function main() {
  console.log('🔍 Running APPOINTMENTS CACHE validation...')

  const qc = new QueryClient()
  let calls = 0

  const fetcher = async () => {
    calls++
    return { items: [{ id: 'a1' }], total: 1 }
  }

  await qc.fetchQuery({ queryKey: ['appointments'], queryFn: fetcher, staleTime: 60_000 })
  await qc.fetchQuery({ queryKey: ['appointments'], queryFn: fetcher, staleTime: 60_000 })

  if (calls !== 1) {
    throw new Error(`❌ Cache not working, calls=${calls} expected=1`)
  }

  console.log('✅ Cache OK (second fetch served from cache)')
  console.log('\n🎉 APPOINTMENTS CACHE CHECK PASSED')
}

main().catch((e) => {
  console.error('\n🚨 APPOINTMENTS CACHE CHECK FAILED')
  console.error(e.message)
  process.exit(1)
})
