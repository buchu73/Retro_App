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
  updateRetro,
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
      const [v, tks, r] = await Promise.all([
        fetchVotes(c.map(x => x.id)),
        fetchTokens(retroId),
        getRetro(retroId),
      ])
      setCards(c)
      setVotes(v)
      setTokens(tks)
      setRetro(r)
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
  const cardsOpen = !retro.cards_locked
  const votingOpen = !retro.votes_locked
  const facilitatorUrl = `${window.location.origin}/r/${retro.id}?t=${retro.facilitator_token}`

  const nameByToken: Record<string, string> = {}
  tokens.forEach(t => {
    if (t.display_name) nameByToken[t.token] = t.display_name
  })

  const myVoteCount = votes.filter(v => v.voter_token === token).length
  const votesLeft = retro.votes_per_user - myVoteCount

  const participantTokens = tokens.filter(t => t.role === 'participant')
  const connected = participantTokens.filter(t => t.display_name)
  const waiting = participantTokens.length - connected.length

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

  const toggleLock = async (field: 'cards_locked' | 'votes_locked') => {
    const next = !retro[field]
    setRetro(prev => (prev ? { ...prev, [field]: next } : prev)) // optimistic
    try {
      await updateRetro(retro.id, { [field]: next })
    } catch (e: any) {
      alert('Erreur changement de phase : ' + (e.message ?? e))
      refresh()
    }
  }

  const handleToggleVote = async (cardId: string) => {
    if (!token) return
    if (!votingOpen) return
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

  const cardVMs = (col: (typeof columns)[number]): CardVM[] =>
    cards
      .filter(c => c.column_key === col.key)
      .map(c => {
        const voted = hasVoted(c.id)
        return {
          id: c.id,
          content: c.content,
          votes: voteCount(c.id),
          voted,
          voteDisabled: !votingOpen || (!voted && votesLeft <= 0),
          canDelete: c.author_token === token || isFacilitator,
          authorName: retro.show_names ? nameByToken[c.author_token] ?? null : null,
          cardClass: col.cardClass,
        }
      })

  return (
    <div className="p-4 max-w-screen-xl mx-auto">
      <header className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-2xl font-bold">{retro.title}</h1>
          <p className="text-sm text-gray-500">
            {isFacilitator ? 'Animateur' : tokenRow.display_name ?? 'Participant'} ·
            Votes restants : {Math.max(0, votesLeft)}/{retro.votes_per_user}
            {!cardsOpen && ' · Ajouts clos'}
            {!votingOpen && ' · Votes clos'}
          </p>
        </div>
        {isFacilitator && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleLock('cards_locked')}
              className="border px-3 py-1 rounded hover:bg-gray-50"
            >
              {cardsOpen ? 'Clore les ajouts' : 'Rouvrir les ajouts'}
            </button>
            <button
              onClick={() => toggleLock('votes_locked')}
              className="border px-3 py-1 rounded hover:bg-gray-50"
            >
              {votingOpen ? 'Clore les votes' : 'Rouvrir les votes'}
            </button>
            <button
              onClick={() =>
                downloadMarkdown(retro, columns, cards, votes, nameByToken, facilitatorUrl, tokens)
              }
              className="border px-3 py-1 rounded hover:bg-gray-50"
            >
              Export MD
            </button>
            <button
              onClick={() =>
                exportPdf(retro, columns, cards, votes, nameByToken, facilitatorUrl, tokens)
              }
              className="border px-3 py-1 rounded hover:bg-gray-50"
            >
              Export PDF
            </button>
          </div>
        )}
      </header>

      <div className="flex gap-4 items-start">
        {isFacilitator && (
          <aside className="w-48 shrink-0 border rounded p-3 bg-gray-50">
            <h2 className="font-bold mb-2">
              Connectés ({connected.length}/{participantTokens.length})
            </h2>
            <ul className="space-y-1 text-sm">
              {connected.map(t => (
                <li key={t.token} className="flex items-center gap-1">
                  <span className="text-green-500">●</span>
                  <span className="truncate">{t.display_name}</span>
                </li>
              ))}
            </ul>
            {connected.length === 0 && (
              <p className="text-sm text-gray-500">Personne pour le moment.</p>
            )}
            {waiting > 0 && (
              <p className="text-sm text-gray-400 mt-2">
                {waiting} siège{waiting > 1 ? 's' : ''} en attente
              </p>
            )}
          </aside>
        )}

        <div
          className="grid gap-4 flex-1"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
          }}
        >
          {columns.map(col => (
            <Column
              key={col.key}
              label={col.label}
              columnKey={col.key}
              columnClass={col.columnClass}
              cards={cardVMs(col)}
              canAddCards={cardsOpen}
              onAddCard={handleAddCard}
              onToggleVote={handleToggleVote}
              onDeleteCard={handleDeleteCard}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default RetroBoard
