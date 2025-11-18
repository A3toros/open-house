import { create } from 'zustand'

type ActivityResult = {
  activity: string
  timestamp: number
  payload: unknown
}

type AIStore = {
  results: ActivityResult[]
  addResult: (activity: string, payload: unknown) => void
  clearResults: () => void
}

export const useAIStore = create<AIStore>((set) => ({
  results: [],
  addResult: (activity, payload) =>
    set((state) => ({
      results: [{ activity, payload, timestamp: Date.now() }, ...state.results].slice(0, 20),
    })),
  clearResults: () => set({ results: [] }),
}))

