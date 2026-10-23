import { API_BASE_URL } from './api'

export function resolveMediaUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`
  return url
}
