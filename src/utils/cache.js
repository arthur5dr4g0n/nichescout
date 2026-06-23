// Tiny TTL cache backed by localStorage. Stores { data, source, ts }.
const PREFIX = 'nichescout.cache.'

export const TTL = {
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
}

export function getCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCache(key, payload) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(payload))
  } catch {
    /* quota / private mode — ignore */
  }
}

export function isFresh(ts, ttlMs) {
  return Boolean(ts) && Date.now() - ts < ttlMs
}
