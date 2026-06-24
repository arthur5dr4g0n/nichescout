import { supabase } from './supabase'

// Admin actions — all go through SECURITY DEFINER RPCs (see supabase/admin.sql)
// that verify the caller is admin/super_admin.
export async function listUsers() {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw error
  return data || []
}

export async function setUserRole(target, role) {
  const { error } = await supabase.rpc('admin_set_role', { target, new_role: role })
  if (error) throw error
}

export async function setUserPlan(target, plan) {
  const { error } = await supabase.rpc('admin_set_plan', { target, new_plan: plan })
  if (error) throw error
}

export async function deleteUser(target) {
  const { error } = await supabase.rpc('admin_delete_user', { target })
  if (error) throw error
}
