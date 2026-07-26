import client from './client'

export async function getVideosByPlatform() {
  const res = await client.get('/api/dashboard/videos-by-platform')
  return res.data // { "Flipkart": 12, "Amazon": 8, ... }
}

export async function getUploadStatusBreakdown() {
  const res = await client.get('/api/dashboard/upload-status')
  return res.data // { PENDING: 3, UPLOADING: 1, DONE: 40, FAILED: 2 }
}
