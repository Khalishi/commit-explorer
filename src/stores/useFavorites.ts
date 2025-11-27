/**
 * Favorites Store
 * 
 * This Pinia store manages favorite commits that users can save.
 * It handles:
 * - Storing favorite commit SHAs and full commit data
 * - Persisting favorites to localStorage (browser storage)
 * - Migrating from old storage format (v1) to new format (v2)
 * - Providing getters to check and retrieve favorites
 */
import { defineStore } from 'pinia'
import type { FavoriteCommit } from '../types/github'

// Storage keys for localStorage
// V2 stores full commit data, V1 stores only SHA strings (legacy)
const STORAGE_KEY = 'github-commit-favorites'
const STORAGE_KEY_V2 = 'github-commit-favorites-v2'

/**
 * State interface for the favorites store
 */
interface FavoritesState {
  /** Set of favorite commit SHAs for quick lookup */
  favorites: Set<string>
  /** Map of commit SHA to full commit data for favorites */
  favoriteCommits: Map<string, FavoriteCommit>
  /** Whether the store has been initialized from localStorage */
  initialized: boolean
}

/**
 * Checks if we're running in a browser environment with localStorage available
 * Needed for SSR (Server-Side Rendering) compatibility
 */
const isBrowserEnvironment = (): boolean =>
  typeof window !== 'undefined' && typeof localStorage !== 'undefined'

/**
 * Sorts commits by date in descending order (newest first)
 */
const sortByDateDescending = (a: FavoriteCommit, b: FavoriteCommit) =>
  new Date(b.date).getTime() - new Date(a.date).getTime()

export const useFavoritesStore = defineStore('favorites', {
  state: (): FavoritesState => ({
    favorites: new Set<string>(),
    favoriteCommits: new Map<string, FavoriteCommit>(),
    initialized: false,
  }),

  getters: {
    /**
     * Checks if a commit is favorited
     * 
     * @param sha - The commit SHA to check
     * @returns true if the commit is favorited, false otherwise
     */
    isFavorite: state => {
      return (sha: string): boolean => state.favorites.has(sha)
    },
    /**
     * Gets all favorite commit SHAs as an array
     * 
     * @returns Array of commit SHA strings
     */
    getAllFavorites: state => Array.from(state.favorites),
    /**
     * Gets all favorite commits with full data, sorted by date (newest first)
     * 
     * @returns Array of FavoriteCommit objects sorted by date descending
     */
    getAllFavoriteCommits: state =>
      Array.from(state.favoriteCommits.values()).sort(sortByDateDescending),
    /**
     * Gets a specific favorite commit by SHA
     * 
     * @param sha - The commit SHA to retrieve
     * @returns The FavoriteCommit object or undefined if not found
     */
    getFavoriteCommit: state => {
      return (sha: string): FavoriteCommit | undefined =>
        state.favoriteCommits.get(sha)
    },
  },

  actions: {
    /**
     * Initializes the store by loading favorites from localStorage
     * 
     * Migration logic:
     * - First tries to load from V2 format (full commit data)
     * - Falls back to V1 format (SHA strings only) if V2 doesn't exist
     * - Only runs once per session (idempotent)
     * - Handles errors gracefully by resetting to empty state
     */
    initialize() {
      if (this.initialized || !isBrowserEnvironment()) {
        this.initialized = true
        return
      }

      try {
        // Try loading from V2 format first (preferred - has full commit data)
        const storedV2 = localStorage.getItem(STORAGE_KEY_V2)
        if (storedV2) {
          const commits = JSON.parse(storedV2) as FavoriteCommit[]
          // Convert array to Map for O(1) lookup by SHA
          this.favoriteCommits = new Map(commits.map(commit => [commit.sha, commit]))
          // Extract SHAs into Set for quick membership checks
          this.favorites = new Set(commits.map(commit => commit.sha))
          this.initialized = true
          return
        }

        // Fallback to V1 format (legacy - only SHA strings)
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const favoriteArray = JSON.parse(stored) as string[]
          this.favorites = new Set(favoriteArray)
        }
      } catch (error) {
        console.error('Failed to load favorites from localStorage:', error)
        // Reset to empty state on error
        this.favorites = new Set()
        this.favoriteCommits = new Map()
      } finally {
        this.initialized = true
      }
    },

    /**
     * Saves favorites to localStorage
     * 
     * Saves in both V2 (full commit data) and V1 (SHA strings) formats
     * for backward compatibility. Only runs in browser environment.
     */
    persistFavorites() {
      if (!isBrowserEnvironment()) {
        return
      }

      try {
        // Save full commit data in V2 format
        const commits = Array.from(this.favoriteCommits.values())
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(commits))
        // Also save SHA list in V1 format for backward compatibility
        const favoriteArray = Array.from(this.favorites)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteArray))
      } catch (error) {
        console.error('Failed to save favorites to localStorage:', error)
      }
    },

    /**
     * Toggles a commit's favorite status
     * 
     * @param sha - The commit SHA to toggle
     * @param commitData - Optional full commit data to store if adding to favorites
     * 
     * If the commit is already favorited, removes it. Otherwise, adds it.
     */
    toggleFavorite(sha: string, commitData?: FavoriteCommit) {
      if (this.favorites.has(sha)) {
        this.removeFavorite(sha)
        return
      }

      this.addFavorite(sha, commitData)
    },

    /**
     * Adds a commit to favorites
     * 
     * @param sha - The commit SHA to add
     * @param commitData - Optional full commit data to store
     * 
     * Adds the SHA to the favorites set and optionally stores full commit data.
     * Automatically persists to localStorage after adding.
     */
    addFavorite(sha: string, commitData?: FavoriteCommit) {
      this.favorites.add(sha)

      if (commitData) {
        this.favoriteCommits.set(sha, commitData)
      }

      this.persistFavorites()
    },

    /**
     * Removes a commit from favorites
     * 
     * @param sha - The commit SHA to remove
     * 
     * Removes both the SHA from the set and any stored commit data.
     * Automatically persists to localStorage after removing.
     */
    removeFavorite(sha: string) {
      this.favorites.delete(sha)
      this.favoriteCommits.delete(sha)
      this.persistFavorites()
    },
  },
})

/**
 * Composable function to use the favorites store
 * 
 * Automatically initializes the store when called, ensuring favorites
 * are loaded from localStorage before use.
 * 
 * @returns The initialized favorites store
 */
export const useFavorites = () => {
  const favoritesStore = useFavoritesStore()
  favoritesStore.initialize()
  return favoritesStore
}
