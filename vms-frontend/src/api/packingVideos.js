import client from './client'

export async function lookupOrderByBarcode(barcode) {
  const res = await client.get(`/api/packing-videos/lookup-order/${encodeURIComponent(barcode)}`)
  return res.data // Order
}

export async function uploadPackingVideo({ orderBarcode, file, durationSeconds, platformId }) {
  const form = new FormData()
  form.append('file', file)
  if (durationSeconds != null) form.append('durationSeconds', durationSeconds)
  if (platformId != null) form.append('platformId', platformId)

  const res = await client.post(
    `/api/packing-videos/${encodeURIComponent(orderBarcode)}/upload`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return res.data
}
