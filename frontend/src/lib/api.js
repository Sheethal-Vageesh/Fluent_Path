// import axios from 'axios'

// export const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
// })

// export function setAuthToken(token) {
//   if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
//   else delete api.defaults.headers.common.Authorization
// }

import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000'
    : 'https://fluent-path.onrender.com')

export const api = axios.create({
  baseURL: API_BASE_URL,
})

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization =
      `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}