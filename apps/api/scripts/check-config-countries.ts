import fetch from 'node-fetch'

async function main() {
  const base = process.env.API_URL ?? 'http://localhost:3000'
  console.log('🔍 Running CONFIG COUNTRIES validation...')

  const res = await fetch(`${base}/config/countries`)
  if (!res.ok) {
    console.error(`❌ GET /config/countries failed (${res.status})`)
    process.exit(1)
  }

  const data = await res.json()
  if (!data?.items?.length) {
    console.error('❌ No countries returned')
    process.exit(1)
  }

  const ga = data.items.find((c: any) => c.code === 'GA')
  if (!ga || ga.currency !== 'FCFA') {
    console.error('❌ GA country missing or wrong currency')
    process.exit(1)
  }

  console.log(`✅ Countries OK (count=${data.items.length})`)
  console.log('🎉 CONFIG COUNTRIES CHECK PASSED')
}

main().catch((e) => {
  console.error('🚨 CONFIG COUNTRIES CHECK FAILED')
  console.error(e)
  process.exit(1)
})
