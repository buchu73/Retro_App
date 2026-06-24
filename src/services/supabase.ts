import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseAnonKey)

// Example wrapper functions – will be fleshed out later
// Helper to generate a random UUID for tokens
// Using native crypto.randomUUID() (available in modern browsers & Node)

export const createRetro = async (
  params: {
    title: string
    type: 'mad_sad_glad' | 'speedboat'
    show_names: boolean
    votes_per_user?: number
    participants: number
  },
  facilitatorToken: string
) => {
  // Insert the retro and return the created row (including its id).
  // `facilitator_token` is NOT NULL on the table, so it must be supplied here.
  const { data, error } = await supabase
    .from('retros')
    .insert([{ ...params, facilitator_token: facilitatorToken }])
    .select('id')
    .single()
  if (error) throw error
  return data
}

/** Create the facilitator token row for a given retro */
export const createFacilitatorToken = async (retroId: string, token: string) => {
  const { error } = await supabase.from('tokens').insert([
    { retro_id: retroId, token, role: 'facilitator', display_name: null },
  ])
  if (error) throw error
  return token
}

/** Create `count` participant tokens for a retro */
export const createParticipantTokens = async (retroId: string, count: number) => {
  const rows = Array.from({ length: count }, () => ({
    retro_id: retroId,
    token: crypto.randomUUID(),
    role: 'participant' as const,
    display_name: null,
  }))
  const { error } = await supabase.from('tokens').insert(rows)
  if (error) throw error
  return rows.map(r => r.token)
}

/** Full flow: create retro, facilitator token and participant tokens */
export const createFullRetro = async (params: {
  title: string
  type: 'mad_sad_glad' | 'speedboat'
  show_names: boolean
  votes_per_user?: number
  participants: number
}) => {
  // Generate the facilitator token up front so it can be stored on the retro
  // row (facilitator_token is NOT NULL) and reused for its token row.
  const facilitatorToken = crypto.randomUUID()
  const retro = await createRetro(params, facilitatorToken)
  const retroId = retro.id as string
  await createFacilitatorToken(retroId, facilitatorToken)
  const participantTokens = await createParticipantTokens(
    retroId,
    params.participants
  )
  return { retroId, facilitatorToken, participantTokens }
}

// Additional functions (addCard, toggleVote, subscribeCards, subscribeVotes, fetchRetro, claimToken, etc.) will be added.
