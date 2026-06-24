import React, { useState } from 'react'
import CardComponent, { CardVM } from './Card'

interface ColumnProps {
  label: string
  columnKey: string
  cards: CardVM[]
  onAddCard: (columnKey: string, content: string) => void
  onToggleVote: (cardId: string) => void
  onDeleteCard: (cardId: string) => void
}

const Column: React.FC<ColumnProps> = ({
  label,
  columnKey,
  cards,
  onAddCard,
  onToggleVote,
  onDeleteCard,
}) => {
  const [text, setText] = useState('')

  const submit = () => {
    const value = text.trim()
    if (!value) return
    onAddCard(columnKey, value)
    setText('')
  }

  return (
    <div className="border rounded p-3 bg-gray-50 flex flex-col">
      <h2 className="font-bold mb-2 text-center">{label}</h2>

      <div className="mb-3">
        <textarea
          className="border rounded w-full p-1 text-sm"
          rows={2}
          placeholder="Ajouter une carte… (Ctrl/⌘+Entrée)"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <button
          onClick={submit}
          className="mt-1 w-full bg-blue-500 text-white rounded py-1 text-sm hover:bg-blue-600"
        >
          Ajouter
        </button>
      </div>

      <div className="flex-1">
        {cards.map(c => (
          <CardComponent
            key={c.id}
            card={c}
            onToggleVote={onToggleVote}
            onDelete={onDeleteCard}
          />
        ))}
      </div>
    </div>
  )
}

export default Column
