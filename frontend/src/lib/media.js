export function resolveMediaUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  // If a VITE API base URL is configured (e.g., during dev), prefix relative upload paths so requests go to the backend
  const base = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ''
  if (base && url.startsWith('/')) return `${base}${url}`
  return url
}
