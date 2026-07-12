// Central config — reads the REACT_APP_* flags from .env (via Vite envPrefix).
// API keys (RapidAPI, DataForSEO) live server-side only, as Cloudflare Pages
// secrets consumed by functions/api/rapid.js and functions/api/keywords.js.
const env = import.meta.env

// Mock mode is the DEFAULT. Only an explicit "false" turns on real APIs.
export const USE_MOCK = String(env.REACT_APP_USE_MOCK ?? 'true').toLowerCase() !== 'false'

export const COUNTRY = env.REACT_APP_COUNTRY || 'FR'
