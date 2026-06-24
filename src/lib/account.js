import { supabase } from './supabase'

// Best-effort public IP for the audit trail (browsers can't read it directly).
let cachedIp
export async function getClientIp() {
  if (cachedIp !== undefined) return cachedIp
  try {
    const r = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2500) })
    const j = await r.json()
    cachedIp = j.ip || null
  } catch {
    cachedIp = null
  }
  return cachedIp
}

// Audit trail: login, logout, role_change, ban, delete_account, ...
export async function logActivity(userId, action, meta = {}) {
  if (!supabase || !userId) return
  try {
    const ip = await getClientIp()
    await supabase.from('activity_logs').insert({ user_id: userId, action, ip, meta })
  } catch {
    /* logging must never break the app */
  }
}

export async function getProfile(userId) {
  if (!supabase || !userId) return null
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    return data
  } catch {
    return null
  }
}

export async function updateProfile(userId, patch) {
  if (!supabase) return { error: { message: 'not_configured' } }
  return supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', userId)
}

export async function getActivity(userId, limit = 10) {
  if (!supabase || !userId) return []
  const { data } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function deleteOwnAccount() {
  if (!supabase) return { error: { message: 'not_configured' } }
  return supabase.rpc('delete_own_account')
}
