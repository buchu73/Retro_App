export type RetroType = 'mad_sad_glad' | 'speedboat'

export interface ColumnDef {
  key: string
  label: string
  /** Translucent background + border for the column container. */
  columnClass: string
  /** Thin accent border for cards in this column. */
  cardClass: string
}

/** Column layout per retro type. Add new formats here. */
export const RETRO_COLUMNS: Record<RetroType, ColumnDef[]> = {
  mad_sad_glad: [
    { key: 'mad', label: 'Mad 😡', columnClass: 'bg-red-100/50 border-red-200', cardClass: 'border-l-4 border-l-red-400' },
    { key: 'sad', label: 'Sad 😢', columnClass: 'bg-blue-100/50 border-blue-200', cardClass: 'border-l-4 border-l-blue-400' },
    { key: 'glad', label: 'Glad 😀', columnClass: 'bg-green-100/50 border-green-200', cardClass: 'border-l-4 border-l-green-400' },
  ],
  speedboat: [
    { key: 'wind', label: 'Vent (ce qui pousse)', columnClass: 'bg-sky-100/50 border-sky-200', cardClass: 'border-l-4 border-l-sky-400' },
    { key: 'anchor', label: 'Ancres (ce qui freine)', columnClass: 'bg-red-100/50 border-red-200', cardClass: 'border-l-4 border-l-red-400' },
    { key: 'rocks', label: 'Rochers (risques)', columnClass: 'bg-orange-100/50 border-orange-200', cardClass: 'border-l-4 border-l-orange-400' },
    { key: 'island', label: 'Île (objectif)', columnClass: 'bg-green-100/50 border-green-200', cardClass: 'border-l-4 border-l-green-400' },
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
  cards_locked: boolean
  votes_locked: boolean
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
