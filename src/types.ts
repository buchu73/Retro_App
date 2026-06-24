export type RetroType = 'mad_sad_glad' | 'speedboat'

export interface ColumnDef {
  key: string
  label: string
}

/** Column layout per retro type. Add new formats here. */
export const RETRO_COLUMNS: Record<RetroType, ColumnDef[]> = {
  mad_sad_glad: [
    { key: 'mad', label: 'Mad 😡' },
    { key: 'sad', label: 'Sad 😢' },
    { key: 'glad', label: 'Glad 😀' },
  ],
  speedboat: [
    { key: 'wind', label: 'Vent (ce qui pousse)' },
    { key: 'anchor', label: 'Ancres (ce qui freine)' },
    { key: 'rocks', label: 'Rochers (risques)' },
    { key: 'island', label: 'Île (objectif)' },
  ],
}

export interface Retro {
  id: string
  title: string
  type: RetroType
  show_names: boolean
  votes_per_user: number
  facilitator_token: string
  participants: number
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
