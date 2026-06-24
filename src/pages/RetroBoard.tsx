import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  getRetro,
  getToken,
  claimToken,
  fetchCards,
  fetchVotes,
  fetchTokens,
  addCard,
  deleteCard,
  addVote,
  removeVote,
  subscribeRetro,
} from '../services/supabase'
import Column from '../components/Column'
import type { CardVM } from '../components/Card'
import { RETRO_COLUMNS } from '../types'
import type { Card, Retro, Token, Vote } from '../types'
import { downloadMarkdown, exportPdf } from '../lib/export'

const RetroBoard: React.FC = () => {
  const { retroId } = useParams<{ retroId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('t')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retro, setRetro] = useState<Retro | null>(null)
  const [tokenRow, setTokenRow] = useState<Token | null>(null)
  const [needsName, setNeedsName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  const [cards, setCards] = useState<Card[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [tokens, setTokens] = useState<Token[]>([])

  // Validate the token and load the retro.
  useEffect(() => {
    let active = true
    ;(async () => {
      if (!retroId || !token) {
        setError('Lien invalide : identifiant ou token manquant.')
        setLoading(false)
        return
      }
      try {
        const t = await getToken(retroId, token)
        if (!active) return
        if (!t) {
          setError('Token invalide ou inconnu pour cette rétrospective.')
          setLoading(false)
          return
        }
        const r = await getRetro(retroId)
        if (!active) return
        setTokenRow(t)
        setRetro(r)
        setNeedsName(!t.display_name)
        setLoading(false)
      } catch (e: any) {
        if (active) {
          setError(e.message ?? String(e))
          setLoading(false)
        }
      }
    })()
    return () => {
      active = false
    }
  }, [retroId, token])

  const refresh = useCallback(async () => {
    if (!retroId) return
    try {
      const c = await fetchCards(retroId)
      const [v, tks] = await Promise.all([
        fetchVotes(c.map(x => x.id)),
        fetchTokens(retroId),
      ])
      setCards(c)
      setVotes(v)
      setTokens(tks)
    } catch {
      /* transient error, will retry on next realtime event */
    }
  }, [retroId])

  // Load the board and subscribe to realtime once the user is in.
  useEffect(() => {
    if (!retroId || needsName || !tokenRow) return
    refresh()
    const unsub = subscribeRetro(retroId, refresh)
    return unsub
  }, [retroId, needsName, tokenRow, refresh])

  const submitName = async () => {
    const name = nameInput.trim()
    if (!name || !token) return
    try {
      await claimToken(token, name)
      setTokenRow(prev => (prev ? { ...prev, display_name: name } : prev))
      setNeedsName(false)
    } catch (e: any) {
      alert('Erreur enregistrement du nom : ' + (e.message ?? e))
    }
  }

  if (loading) return <div className="p-6">Chargement…</div>
  if (error) return <div className="p-6 text-red-600">⚠️ {error}</div>
  if (!retro || !tokenRow) return null

  if (needsName) {
    return (
      <div className="max-w-sm mx-auto p-6">
        <h1 className="text-xl mb-2 font-bold">{retro.title}</h1>
        <p className="mb-4 text-gray-600">
          Entrez votre nom pour rejoindre la rétrospective.
        </p>
        <input
          className="border rounded w-full p-2 mb-3"
          value={nameInput}
          autoFocus
          onChange={e => setNameInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') submitName()
          }}
          placeholder="Votre nom"
        />
        <button
          onClick={submitName}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600"
        >
          Rejoindre
        </button>
      </div>
    )
  }

  const isFacilitator = tokenRow.role === 'facilitator'
  const columns = RETRO_COLUMNS[retro.type]

  const nameByToken: Record<string, string> = {}
  tokens.forEach(t => {
    if (t.display_name) nameByToken[t.token] = t.display_name
  })

  const myVoteCount = votes.filter(v => v.voter_token === token).length
  const votesLeft = retro.votes_per_user - myVoteCount

  const voteCount = (cardId: string) =>
    votes.filter(v => v.card_id === cardId).length
  const hasVoted = (cardId: string) =>
    votes.some(v => v.card_id === cardId && v.voter_token === token)

  const handleAddCard = async (columnKey: string, content: string) => {
    if (!token) return
    try {
      await addCard(retro.id, columnKey, content, token)
      refresh()
    } catch (e: any) {
      alert('Erreur ajout carte : ' + (e.message ?? e))
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCard(cardId)
      refresh()
    } catch (e: any) {
      alert('Erreur suppression : ' + (e.message ?? e))
    }
  }

  const handleToggleVote = async (cardId: string) => {
    if (!token) return
    if (hasVoted(cardId)) {
      // optimistic remove
      setVotes(prev =>
        prev.filter(v => !(v.card_id === cardId && v.voter_token === token))
      )
      try {
        await removeVote(cardId, token)
      } catch {
        refresh()
      }
    } else {
      if (votesLeft <= 0) {
        alert(`Limite de ${retro.votes_per_user} votes atteinte.`)
        return
      }
      // optimistic add
      setVotes(prev => [
        ...prev,
        { id: `tmp-${cardId}-${token}`, card_id: cardId, voter_token: token },
      ])
      try {
        await addVote(cardId, token)
      } catch {
        refresh()
      }
    }
  }

  const cardVMs = (columnKey: string): CardVM[] =>
    cards
      .filter(c => c.column_key === columnKey)
      .map(c => ({
        id: c.id,
        content: c.content,
        votes: voteCount(c.id),
        voted: hasVoted(c.id),
        canVote: votesLeft > 0,
        canDelete: c.author_token === token || isFacilitator,
        authorName: retro.show_names ? nameByToken[c.author_token] ?? null : null,
      }))

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-2xl font-bold">{retro.title}</h1>
          <p className="text-sm text-gray-500">
            {isFacilitator ? 'Animateur' : tokenRow.display_name ?? 'Participant'} ·
            Votes restants : {Math.max(0, votesLeft)}/{retro.votes_per_user}
          </p>
        </div>
        {isFacilitator && (
          <div className="flex gap-2">
            <button
              onClick={() =>
                downloadMarkdown(retro, columns, cards, votes, nameByToken)
              }
              className="border px-3 py-1 rounded hover:bg-gray-50"
            >
              Export MD
            </button>
            <button
              onClick={() => exportPdf(retro, columns, cards, votes, nameByToken)}
              className="border px-3 py-1 rounded hover:bg-gray-50"
            >
              Export PDF
            </button>
          </div>
        )}
      </header>

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
        }}
      >
        {columns.map(col => (
          <Column
            key={col.key}
            label={col.label}
            columnKey={col.key}
            cards={cardVMs(col.key)}
            onAddCard={handleAddCard}
            onToggleVote={handleToggleVote}
            onDeleteCard={handleDeleteCard}
          />
        ))}
      </div>
    </div>
  )
}

export default RetroBoard
