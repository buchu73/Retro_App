import React, { useState } from 'react'
import { createFullRetro } from '../services/supabase'

const CreateRetro: React.FC = () => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'mad_sad_glad' | 'speedboat'>('mad_sad_glad')
  const [participants, setParticipants] = useState(5)
  const [showNames, setShowNames] = useState(true)
  const [votesPerUser, setVotesPerUser] = useState(5)
  const [facilitatorLink, setFacilitatorLink] = useState<string | null>(null)
  const [publicLink, setPublicLink] = useState<string | null>(null)
  const [participantLinks, setParticipantLinks] = useState<string[]>([])

  const handleCreate = async () => {
    try {
      const { retroId, facilitatorToken, participantTokens } = await createFullRetro({
        title,
        type,
        show_names: showNames,
        votes_per_user: votesPerUser,
        participants,
      })

      const base = window.location.origin
      setFacilitatorLink(`${base}/r/${retroId}?t=${facilitatorToken}`)
      setPublicLink(`${base}/j/${retroId}`)
      setParticipantLinks(participantTokens.map(t => `${base}/r/${retroId}?t=${t}`))
    } catch (e: any) {
      alert('Erreur création rétro: ' + (e.message ?? e))
    }
  }

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl mb-4">Créer une rétrospective</h1>
      <div className="mb-2">
        <label className="block">Titre</label>
        <input className="border rounded w-full" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div className="mb-2">
        <label className="block">Type</label>
        <select value={type} onChange={e => setType(e.target.value as any)} className="border rounded w-full">
          <option value="mad_sad_glad">Mad / Sad / Glad</option>
          <option value="speedboat">Speedboat</option>
        </select>
      </div>
      <div className="mb-2">
        <label className="block">Nombre de participants</label>
        <input type="number" min={1} className="border rounded w-full" value={participants} onChange={e => setParticipants(parseInt(e.target.value))} />
      </div>
      <div className="mb-2">
        <label className="block">Votes par participant</label>
        <input type="number" min={1} className="border rounded w-full" value={votesPerUser} onChange={e => setVotesPerUser(parseInt(e.target.value) || 1)} />
      </div>
      <div className="mb-4">
        <label className="inline-flex items-center">
          <input type="checkbox" checked={showNames} onChange={e => setShowNames(e.target.checked)} className="mr-2" />
          Afficher les noms
        </label>
      </div>
      <button onClick={handleCreate} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Créer
      </button>

      {facilitatorLink && (
        <div className="mt-6 space-y-6">
          <div>
            <h2 className="text-xl mb-1">Lien animateur (le vôtre)</h2>
            <p className="text-sm text-gray-500 mb-1">À conserver : il donne accès à l'animation et aux exports.</p>
            <div className="flex gap-2 items-start">
              <code className="flex-1 break-all bg-gray-100 rounded p-2 text-sm">{facilitatorLink}</code>
              <button onClick={() => copy(facilitatorLink)} className="border px-2 py-1 rounded text-sm whitespace-nowrap">Copier</button>
            </div>
          </div>

          {publicLink && (
            <div>
              <h2 className="text-xl mb-1">Lien public (siège libre)</h2>
              <p className="text-sm text-gray-500 mb-1">
                Un seul lien à partager : chaque personne saisit son nom et prend un siège disponible.
              </p>
              <div className="flex gap-2 items-start">
                <code className="flex-1 break-all bg-gray-100 rounded p-2 text-sm">{publicLink}</code>
                <button onClick={() => copy(publicLink)} className="border px-2 py-1 rounded text-sm whitespace-nowrap">Copier</button>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl">Liens participants nominatifs ({participantLinks.length})</h2>
              <button onClick={() => copy(participantLinks.join('\n'))} className="border px-2 py-1 rounded text-sm">Tout copier</button>
            </div>
            <ul className="space-y-2">
              {participantLinks.map((l, i) => (
                <li key={l} className="flex gap-2 items-start">
                  <code className="flex-1 break-all bg-gray-100 rounded p-2 text-sm">{l}</code>
                  <button onClick={() => copy(l)} className="border px-2 py-1 rounded text-sm whitespace-nowrap">Copier</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateRetro
