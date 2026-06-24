import React from 'react'

/** View model passed from the board (already-computed display state). */
export interface CardVM {
  id: string
  content: string
  votes: number
  voted: boolean
  voteDisabled: boolean
  canDelete: boolean
  authorName: string | null
  /** Accent border class for the column this card belongs to. */
  cardClass: string
}

interface CardProps {
  card: CardVM
  onToggleVote: (cardId: string) => void
  onDelete: (cardId: string) => void
}

const CardComponent: React.FC<CardProps> = ({ card, onToggleVote, onDelete }) => {
  return (
    <div className={`border rounded p-2 mb-2 bg-white shadow-sm ${card.cardClass}`}>
      <p className="whitespace-pre-wrap break-words">{card.content}</p>
      <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
        <button
          onClick={() => onToggleVote(card.id)}
          disabled={card.voteDisabled}
          className={
            'px-2 py-0.5 rounded border transition-colors disabled:opacity-40 ' +
            (card.voted
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50')
          }
        >
          ▲ {card.votes}
        </button>
        <div className="flex items-center gap-2">
          {card.authorName && <span className="italic">{card.authorName}</span>}
          {card.canDelete && (
            <button
              onClick={() => onDelete(card.id)}
              className="text-red-500 hover:underline"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CardComponent
