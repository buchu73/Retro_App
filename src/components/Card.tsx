import React from 'react'
import type { Card } from '../types'

interface CardProps {
  card: Card
}

const CardComponent: React.FC<CardProps> = ({ card }) => {
  return (
    <div className="border rounded p-2 mb-2 bg-white shadow-sm">
      <p>{card.content}</p>
      {/* Vote button placeholder */}
      <div className="flex justify-between items-center mt-1 text-sm text-gray-600">
        <span>Votes: 0</span>
        <button className="text-blue-500">+Vote</button>
      </div>
    </div>
  )
}

export default CardComponent
