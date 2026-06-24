export type RetroType = 'mad_sad_glad' | 'speedboat'

export interface Retro {
  id: string
  title: string
  type: RetroType
  show_names: boolean
  votes_per_user: number
  created_at: string
}

export interface Card {
  id: string
  retro_id: string
  column_key: string
  content: string
  author_token: string
  created_at: string
}

export interface Vote {
  id: string
  card_id: string
  voter_token: string
}

export interface Token {
  id: string
  retro_id: string
  token: string
  role: 'facilitator' | 'participant'
  display_name: string | null
  claimed_at: string | null
}
