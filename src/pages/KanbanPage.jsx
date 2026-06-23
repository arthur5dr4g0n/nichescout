import { useState } from 'react'
import { COLUMNS } from '../hooks/useKanban'
import { downloadCSV } from '../utils/csv'
import { DownloadIcon, TrashIcon } from '../components/icons'

const SCORE_RING = {
  green: 'bg-green-50 text-green-700 ring-green-200',
  orange: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  gray: 'bg-slate-100 text-slate-500 ring-slate-200',
}

function Card({ card, onDragStart, onRemove, onNotes }) {
  const [editing, setEditing] = useState(false)
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      className="group cursor-grab rounded-lg border border-line bg-canvas p-3 shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold capitalize text-slate-900">{card.niche}</p>
        {card.score != null && (
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ring-1 ${SCORE_RING[card.color] || SCORE_RING.gray}`}>
            {card.score}
          </span>
        )}
      </div>
      {card.category && <p className="mt-0.5 text-[11px] text-slate-400">{card.category}</p>}

      {editing ? (
        <textarea
          autoFocus
          defaultValue={card.notes}
          onBlur={(e) => {
            onNotes(card.id, e.target.value)
            setEditing(false)
          }}
          placeholder="Notes…"
          className="mt-2 w-full resize-none rounded-md border border-line bg-surface p-2 text-xs text-slate-700 focus:border-brand focus:outline-none"
          rows={3}
        />
      ) : (
        <p
          onClick={() => setEditing(true)}
          className="mt-2 min-h-[1.25rem] cursor-text rounded-md text-xs text-slate-500 hover:bg-surface2"
        >
          {card.notes || <span className="italic text-slate-400">+ add notes</span>}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{new Date(card.date).toLocaleDateString()}</span>
        <button onClick={() => onRemove(card.id)} className="text-slate-300 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100" aria-label="Delete">
          <TrashIcon size={14} />
        </button>
      </div>
    </div>
  )
}

export default function KanbanPage({ kanban }) {
  const { board, addCard, moveCard, removeCard, updateCard, clear } = kanban
  const [dragOver, setDragOver] = useState(null)
  const [newNiche, setNewNiche] = useState('')

  const onDragStart = (e, id) => e.dataTransfer.setData('text/plain', id)
  const onDrop = (e, col) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) moveCard(id, col)
    setDragOver(null)
  }

  const add = () => {
    if (!newNiche.trim()) return
    addCard({ niche: newNiche.trim() }, 'analyser')
    setNewNiche('')
  }

  const exportCsv = () => {
    const rows = COLUMNS.flatMap((col) =>
      board[col.id].map((c) => ({ column: col.label, ...c, date: new Date(c.date).toISOString().slice(0, 10) })),
    )
    downloadCSV('kanban-board.csv', rows, [
      { key: 'column', label: 'Status' },
      { key: 'niche', label: 'Niche' },
      { key: 'score', label: 'Score' },
      { key: 'category', label: 'Category' },
      { key: 'notes', label: 'Notes' },
      { key: 'date', label: 'Date' },
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Research Board</h1>
          <p className="mt-1 text-sm text-slate-500">Drag niches across stages. Saved locally in your browser.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={exportCsv}>
            <DownloadIcon size={16} /> Export CSV
          </button>
          <button className="btn border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" onClick={clear}>
            <TrashIcon size={16} /> Clear
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={newNiche}
          onChange={(e) => setNewNiche(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add a niche to analyze…"
          className="input max-w-sm"
        />
        <button className="btn-primary" onClick={add}>Add</button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(col.id)
            }}
            onDragLeave={() => setDragOver((c) => (c === col.id ? null : c))}
            onDrop={(e) => onDrop(e, col.id)}
            className={`flex flex-col rounded-xl border bg-surface p-3 transition-colors ${
              dragOver === col.id ? 'border-brand bg-brand-tint' : 'border-line'
            }`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-slate-700">
                {col.emoji} {col.label}
              </span>
              <span className="rounded-full bg-surface2 px-2 py-0.5 text-xs font-medium text-slate-500">{board[col.id].length}</span>
            </div>
            <div className="flex min-h-[120px] flex-1 flex-col gap-2">
              {board[col.id].length === 0 && (
                <p className="rounded-lg border border-dashed border-line py-6 text-center text-xs text-slate-400">Drop here</p>
              )}
              {board[col.id].map((card) => (
                <Card key={card.id} card={card} onDragStart={onDragStart} onRemove={removeCard} onNotes={updateCard ? (id, notes) => updateCard(id, { notes }) : undefined} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
