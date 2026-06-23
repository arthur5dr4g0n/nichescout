import { supabase } from './supabase'

// Per-user storage in a single row: user_data(user_id, saved jsonb, board jsonb).
export async function ensureRow(userId) {
  try {
    await supabase.from('user_data').upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
  } catch {
    /* table may not exist yet — the app still works from memory */
  }
}

export async function fetchUserData(userId) {
  try {
    const { data } = await supabase.from('user_data').select('saved, board').eq('user_id', userId).maybeSingle()
    return data || {}
  } catch {
    return {}
  }
}

export async function saveColumn(userId, patch) {
  try {
    return await supabase.from('user_data').update(patch).eq('user_id', userId)
  } catch {
    return { error: true }
  }
}
