import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseAnonKey)

// Example wrapper functions – will be fleshed out later
export const createRetro = async (params: {
  title: string
  type: 'mad_sad_glad' | 'speedboat'
  show_names: boolean
  votes_per_user?: number
  participants: number
}) => {
  // Placeholder – actual implementation will insert into `retros` and generate tokens via RPC or client‑side inserts
  return supabase.from('retros').insert([params])
}

// Additional functions (addCard, toggleVote, subscribeCards, subscribeVotes, fetchRetro, claimToken, etc.) will be added.
