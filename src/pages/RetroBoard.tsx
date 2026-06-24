import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import Column from '../components/Column'
import { Card } from '../types'

const RetroBoard: React.FC = () => {
  const { retroId } = useParams<{ retroId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('t')
  const [cards, setCards] = useState<Card[]>([])

  // Placeholder: fetch cards once
  useEffect(() => {
    if (retroId) {
      supabase.from('cards').select('*').eq('retro_id', retroId).then(({ data }) => {
        if (data) setCards(data as Card[])
      })
    }
  }, [retroId])

  // TODO: realtime subscriptions, add card UI, voting, etc.

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Rétro {retroId}</h1>
      <div className="grid grid-cols-3 gap-4">
        <Column title="Colonne 1" cards={cards.filter(c => c.column_key === 'col1')} />
        <Column title="Colonne 2" cards={cards.filter(c => c.column_key === 'col2')} />
        <Column title="Colonne 3" cards={cards.filter(c => c.column_key === 'col3')} />
      </div>
    </div>
  )
}

export default RetroBoard
