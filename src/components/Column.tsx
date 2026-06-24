import React from 'react'
import CardComponent from './Card'
import type { Card } from '../types'

interface ColumnProps {
  title: string
  cards: Card[]
}

const Column: React.FC<ColumnProps> = ({ title, cards }) => {
  return (
    <div className="border rounded p-2 bg-gray-50">
      <h2 className="font-bold mb-2 text-center">{title}</h2>
      {cards.map(card => (
        <CardComponent key={card.id} card={card} />
      ))}
    </div>
  )
}

export default Column
