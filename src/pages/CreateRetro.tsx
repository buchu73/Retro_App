import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, createRetro } from '../services/supabase'

const CreateRetro: React.FC = () => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'mad_sad_glad' | 'speedboat'>('mad_sad_glad')
  const [participants, setParticipants] = useState(5)
  const [showNames, setShowNames] = useState(true)
  const [links, setLinks] = useState<string[]>([])
  const navigate = useNavigate()

  const handleCreate = async () => {
    const res = await createRetro({
      title,
      type,
      show_names: showNames,
      votes_per_user: 5,
      participants,
    })
    // TODO: generate tokens and set links
    // For now just navigate to board with placeholder token
    if (res.error) {
      alert('Erreur création rétro: ' + res.error.message)
    } else {
      // placeholder navigation
      const retroId = (res.data?.[0] as any)?.id
      navigate(`/r/${retroId}?t=placeholder`)
    }
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
      <div className="mb-4">
        <label className="inline-flex items-center">
          <input type="checkbox" checked={showNames} onChange={e => setShowNames(e.target.checked)} className="mr-2" />
          Afficher les noms
        </label>
      </div>
      <button onClick={handleCreate} className="bg-blue-500 text-white px-4 py-2 rounded">
        Créer
      </button>
      {links.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl">Liens participants</h2>
          <ul className="list-disc pl-5">
            {links.map(l => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default CreateRetro
