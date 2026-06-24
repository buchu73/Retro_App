import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRetro, claimSeat } from '../services/supabase'
import type { Retro } from '../types'

const seatKey = (retroId: string) => `retro-seat-${retroId}`

const JoinRetro: React.FC = () => {
  const { retroId } = useParams<{ retroId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retro, setRetro] = useState<Retro | null>(null)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!retroId) {
      setError('Lien invalide.')
      setLoading(false)
      return
    }
    // Already seated in this tab? Go straight to the board.
    // sessionStorage is per-tab, so a new window/incognito tab gets a fresh
    // seat instead of reusing the one claimed in another window.
    const existing = sessionStorage.getItem(seatKey(retroId))
    if (existing) {
      navigate(`/r/${retroId}?t=${existing}`, { replace: true })
      return
    }
    getRetro(retroId)
      .then(r => {
        setRetro(r)
        setLoading(false)
      })
      .catch(() => {
        setError('Rétrospective introuvable.')
        setLoading(false)
      })
  }, [retroId, navigate])

  const join = async () => {
    const n = name.trim()
    if (!n || !retroId) return
    setSubmitting(true)
    try {
      const token = await claimSeat(retroId, n)
      sessionStorage.setItem(seatKey(retroId), token)
      navigate(`/r/${retroId}?t=${token}`, { replace: true })
    } catch (e: any) {
      alert('Erreur lors de la connexion : ' + (e.message ?? e))
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6">Chargement…</div>
  if (error) return <div className="p-6 text-red-600">⚠️ {error}</div>

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-xl mb-2 font-bold">{retro?.title}</h1>
      <p className="mb-4 text-gray-600">
        Entrez votre nom pour rejoindre la rétrospective.
      </p>
      <input
        className="border rounded w-full p-2 mb-3"
        value={name}
        autoFocus
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') join()
        }}
        placeholder="Votre nom"
      />
      <button
        onClick={join}
        disabled={submitting || !name.trim()}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 disabled:opacity-50"
      >
        {submitting ? 'Connexion…' : 'Rejoindre'}
      </button>
    </div>
  )
}

export default JoinRetro
