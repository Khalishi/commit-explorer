import { defineStore } from 'pinia'
import type { FavoriteCommit } from '../types/github'

const STORAGE_KEY = 'github-commit-favorites'
const STORAGE_KEY_V2 = 'github-commit-favorites-v2'

interface FavoritesState {
  favorites: Set<string>
  favoriteCommits: Map<string, FavoriteCommit>
  initialized: boolean
}

const isBrowserEnvironment = (): boolean =>
  typeof window !== 'undefined' && typeof localStorage !== 'undefined'

const sortByDateDescending = (a: FavoriteCommit, b: FavoriteCommit) =>
  new Date(b.date).getTime() - new Date(a.date).getTime()

export const useFavoritesStore = defineStore('favorites', {
  state: (): FavoritesState => ({
    favorites: new Set<string>(),
    favoriteCommits: new Map<string, FavoriteCommit>(),
    initialized: false,
  }),

  getters: {
    isFavorite: state => {
      return (sha: string): boolean => state.favorites.has(sha)
    },
    getAllFavorites: state => Array.from(state.favorites),
    getAllFavoriteCommits: state =>
      Array.from(state.favoriteCommits.values()).sort(sortByDateDescending),
    getFavoriteCommit: state => {
      return (sha: string): FavoriteCommit | undefined =>
        state.favoriteCommits.get(sha)
    },
  },

  actions: {
    initialize() {
      if (this.initialized || !isBrowserEnvironment()) {
        this.initialized = true
        return
      }

      try {
        const storedV2 = localStorage.getItem(STORAGE_KEY_V2)
        if (storedV2) {
          const commits = JSON.parse(storedV2) as FavoriteCommit[]
          this.favoriteCommits = new Map(commits.map(commit => [commit.sha, commit]))
          this.favorites = new Set(commits.map(commit => commit.sha))
          this.initialized = true
          return
        }

        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const favoriteArray = JSON.parse(stored) as string[]
          this.favorites = new Set(favoriteArray)
        }
      } catch (error) {
        console.error('Failed to load favorites from localStorage:', error)
        this.favorites = new Set()
        this.favoriteCommits = new Map()
      } finally {
        this.initialized = true
      }
    },

    persistFavorites() {
      if (!isBrowserEnvironment()) {
        return
      }

      try {
        const commits = Array.from(this.favoriteCommits.values())
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(commits))
        const favoriteArray = Array.from(this.favorites)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteArray))
      } catch (error) {
        console.error('Failed to save favorites to localStorage:', error)
      }
    },

    toggleFavorite(sha: string, commitData?: FavoriteCommit) {
      if (this.favorites.has(sha)) {
        this.removeFavorite(sha)
        return
      }

      this.addFavorite(sha, commitData)
    },

    addFavorite(sha: string, commitData?: FavoriteCommit) {
      this.favorites.add(sha)

      if (commitData) {
        this.favoriteCommits.set(sha, commitData)
      }

      this.persistFavorites()
    },

    removeFavorite(sha: string) {
      this.favorites.delete(sha)
      this.favoriteCommits.delete(sha)
      this.persistFavorites()
    },
  },
})

export const useFavorites = () => {
  const favoritesStore = useFavoritesStore()
  favoritesStore.initialize()
  return favoritesStore
}
