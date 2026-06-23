// Central config — reads the REACT_APP_* flags from .env (via Vite envPrefix).
const env = import.meta.env

// Mock mode is the DEFAULT. Only an explicit "false" turns on real APIs.
export const USE_MOCK = String(env.REACT_APP_USE_MOCK ?? 'true').toLowerCase() !== 'false'

export const RAPIDAPI_KEY = env.REACT_APP_RAPIDAPI_KEY || ''
export const RAPIDAPI_HOST = env.REACT_APP_RAPIDAPI_HOST || 'real-time-amazon-data.p.rapidapi.com'
export const COUNTRY = env.REACT_APP_COUNTRY || 'US'

export const DATAFORSEO_LOGIN = env.REACT_APP_DATAFORSEO_LOGIN || ''
export const DATAFORSEO_PASSWORD = env.REACT_APP_DATAFORSEO_PASSWORD || ''

// If real mode is requested but keys are missing, fall back to mock so the
// app never hard-crashes — and tell the UI why.
export const RAPID_READY = Boolean(RAPIDAPI_KEY)
export const DATAFORSEO_READY = Boolean(DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD)
