import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Card, Retro, Token, Vote } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

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

// --- Board: read / write helpers -------------------------------------------

/** Fetch a retro by id */
export const getRetro = async (retroId: string): Promise<Retro> => {
  const { data, error } = await supabase
    .from('retros')
    .select('*')
    .eq('id', retroId)
    .single()
  if (error) throw error
  return data as Retro
}

/** Look up a token row for a retro. Returns null if it doesn't exist. */
export const getToken = async (
  retroId: string,
  token: string
): Promise<Token | null> => {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('retro_id', retroId)
    .eq('token', token)
    .maybeSingle()
  if (error) throw error
  return (data as Token) ?? null
}

/** Update facilitator-controlled flags on a retro (lock cards / votes). */
export const updateRetro = async (
  retroId: string,
  patch: Partial<Pick<Retro, 'cards_locked' | 'votes_locked'>>
) => {
  const { error } = await supabase.from('retros').update(patch).eq('id', retroId)
  if (error) throw error
}

/** Claim a token by attaching a display name (first connection). */
export const claimToken = async (token: string, displayName: string) => {
  const { error } = await supabase
    .from('tokens')
    .update({ display_name: displayName, claimed_at: new Date().toISOString() })
    .eq('token', token)
  if (error) throw error
}

/**
 * Public join: claim a free participant seat for a retro and attach a name.
 * Free seat = a pre-generated participant token with no claimed_at. The
 * conditional UPDATE (.is('claimed_at', null)) is atomic per row, so two
 * users can't grab the same seat. If every planned seat is taken, a new
 * seat is created on the fly (planned count is only indicative).
 * Returns the claimed token.
 */
export const claimSeat = async (
  retroId: string,
  displayName: string
): Promise<string> => {
  const now = new Date().toISOString()

  const { data: free, error } = await supabase
    .from('tokens')
    .select('id, token')
    .eq('retro_id', retroId)
    .eq('role', 'participant')
    .is('claimed_at', null)
    .limit(20)
  if (error) throw error

  for (const seat of free ?? []) {
    const { data: claimed, error: cErr } = await supabase
      .from('tokens')
      .update({ display_name: displayName, claimed_at: now })
      .eq('id', (seat as { id: string }).id)
      .is('claimed_at', null)
      .select('token')
    if (cErr) throw cErr
    if (claimed && claimed.length > 0) return (seat as { token: string }).token
  }

  // No free seat left: create an extra one.
  const token = crypto.randomUUID()
  const { error: insErr } = await supabase.from('tokens').insert([
    { retro_id: retroId, token, role: 'participant', display_name: displayName, claimed_at: now },
  ])
  if (insErr) throw insErr
  return token
}

/** All tokens for a retro (used to resolve author names). */
export const fetchTokens = async (retroId: string): Promise<Token[]> => {
  const { data, error } = await supabase
    .from('tokens')
    .select('*')
    .eq('retro_id', retroId)
  if (error) throw error
  return (data ?? []) as Token[]
}

/** All cards for a retro, oldest first. */
export const fetchCards = async (retroId: string): Promise<Card[]> => {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('retro_id', retroId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Card[]
}

/** Votes for the given card ids. */
export const fetchVotes = async (cardIds: string[]): Promise<Vote[]> => {
  if (cardIds.length === 0) return []
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .in('card_id', cardIds)
  if (error) throw error
  return (data ?? []) as Vote[]
}

export const addCard = async (
  retroId: string,
  columnKey: string,
  content: string,
  authorToken: string
) => {
  const { error } = await supabase
    .from('cards')
    .insert([{ retro_id: retroId, column_key: columnKey, content, author_token: authorToken }])
  if (error) throw error
}

export const deleteCard = async (cardId: string) => {
  const { error } = await supabase.from('cards').delete().eq('id', cardId)
  if (error) throw error
}

export const addVote = async (cardId: string, voterToken: string) => {
  const { error } = await supabase
    .from('votes')
    .insert([{ card_id: cardId, voter_token: voterToken }])
  if (error) throw error
}

export const removeVote = async (cardId: string, voterToken: string) => {
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('card_id', cardId)
    .eq('voter_token', voterToken)
  if (error) throw error
}

/**
 * Subscribe to realtime changes on cards + votes for a retro.
 * Calls `onChange` on any insert/update/delete. Returns an unsubscribe fn.
 */
export const subscribeRetro = (retroId: string, onChange: () => void) => {
  const channel = supabase
    .channel(`retro-${retroId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cards', filter: `retro_id=eq.${retroId}` },
      onChange
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'votes' },
      onChange
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tokens', filter: `retro_id=eq.${retroId}` },
      onChange
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'retros', filter: `id=eq.${retroId}` },
      onChange
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
