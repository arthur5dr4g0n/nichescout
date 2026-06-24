import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from '../components/Toast'
import { listUsers, setUserRole, setUserPlan, deleteUser } from '../lib/admin'
import { SkeletonTable, ErrorState, Badge } from '../components/ui'
import { TrashIcon, SearchIcon } from '../components/icons'

export default function AdminPage() {
  const { t } = useTranslation()
  const { role, user } = useAuth()
  const toast = useToast()
  const isAdmin = role === 'admin' || role === 'super_admin'

  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    listUsers().then(setUsers).catch((e) => setError(e.message || 'error'))
  }, [isAdmin])

  const filtered = useMemo(
    () => (users || []).filter((u) => (u.email || '').toLowerCase().includes(q.trim().toLowerCase())),
    [users, q],
  )

  if (!isAdmin) return <Navigate to="/" replace />

  const patch = (id, p) => setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...p } : u)))

  const onRole = async (u, role) => {
    try {
      await setUserRole(u.id, role)
      patch(u.id, { role })
      toast?.success(t('admin.roleChanged'))
    } catch (e) {
      toast?.error(e.message || t('errors.generic'))
    }
  }
  const onPlan = async (u, plan) => {
    try {
      await setUserPlan(u.id, plan)
      patch(u.id, { plan })
      toast?.success(t('admin.planChanged'))
    } catch (e) {
      toast?.error(e.message || t('errors.generic'))
    }
  }
  const onDelete = async (u) => {
    if (!window.confirm(t('admin.confirmDelete', { email: u.email }))) return
    try {
      await deleteUser(u.id)
      setUsers((list) => list.filter((x) => x.id !== u.id))
      toast?.info(t('admin.deleted'))
    } catch (e) {
      toast?.error(e.message || t('errors.generic'))
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{t('admin.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('admin.subtitle', { n: users?.length ?? 0 })}</p>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.searchPlaceholder')} />
      </div>

      {error && <ErrorState message={error} />}
      {!error && !users && <SkeletonTable rows={8} cols={5} />}

      {!error && users && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{t('admin.colEmail')}</th>
                <th className="px-4 py-3">{t('admin.colRole')}</th>
                <th className="px-4 py-3">{t('admin.colPlan')}</th>
                <th className="px-4 py-3">{t('admin.colCreated')}</th>
                <th className="px-4 py-3 text-right">{t('admin.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSuper = u.role === 'super_admin'
                const isSelf = u.id === user?.id
                return (
                  <tr key={u.id} className="border-b border-line last:border-0 hover:bg-surface2">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{u.email}</span>
                      {isSelf && <Badge tone="brand" className="ml-2">{t('admin.you')}</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      {isSuper ? (
                        <Badge tone="green">super_admin</Badge>
                      ) : (
                        <select className="rounded-lg border border-line bg-surface px-2 py-1 text-xs" value={u.role} onChange={(e) => onRole(u, e.target.value)}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select className="rounded-lg border border-line bg-surface px-2 py-1 text-xs" value={u.plan} onChange={(e) => onPlan(u, e.target.value)}>
                        <option value="free">free</option>
                        <option value="pro">pro</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onDelete(u)}
                        disabled={isSuper || isSelf}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                        title={isSuper || isSelf ? t('admin.protected') : t('admin.deleteUser')}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
