import React, { createContext, useReducer, useContext, ReactNode } from 'react'

export type Role = 'facilitator' | 'participant'
export interface RetroState {
  retroId: string | null
  token: string | null
  role: Role | null
  displayName: string | null
  showNames: boolean
  votesPerUser: number
}

type Action =
  | { type: 'SET_REtro'; payload: Partial<RetroState> }
  | { type: 'SET_NAME'; payload: string }

const initialState: RetroState = {
  retroId: null,
  token: null,
  role: null,
  displayName: null,
  showNames: true,
  votesPerUser: 5,
}

const RetroContext = createContext<{
  state: RetroState
  dispatch: React.Dispatch<Action>
}>({ state: initialState, dispatch: () => null })

function reducer(state: RetroState, action: Action): RetroState {
  switch (action.type) {
    case 'SET_REtro':
      return { ...state, ...action.payload }
    case 'SET_NAME':
      return { ...state, displayName: action.payload }
    default:
      return state
  }
}

export const RetroProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <RetroContext.Provider value={{ state, dispatch }}>
      {children}
    </RetroContext.Provider>
  )
}

export const useRetro = () => useContext(RetroContext)
