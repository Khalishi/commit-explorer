import { ref, watch } from 'vue'
import type { FavoriteCommit } from '../types/github'

const STORAGE_KEY = 'github-commit-favorites'
const STORAGE_KEY_V2 = 'github-commit-favorites-v2'
const favorites = ref<Set<string>>(new Set())
const favoriteCommits = ref<Map<string, FavoriteCommit>>(new Map())

// Load favorites from localStorage on initialization
const loadFavorites = () => {
  try {
    // Try to load new format first
    const storedV2 = localStorage.getItem(STORAGE_KEY_V2)
    if (storedV2) {
      const commits = JSON.parse(storedV2) as FavoriteCommit[]
      favoriteCommits.value = new Map(commits.map(c => [c.sha, c]))
      favorites.value = new Set(commits.map(c => c.sha))
      return
    }
    
    // Fallback to old format for backwards compatibility
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const favoriteArray = JSON.parse(stored) as string[]
      favorites.value = new Set(favoriteArray)
    }
  } catch (error) {
    console.error('Failed to load favorites from localStorage:', error)
    favorites.value = new Set()
    favoriteCommits.value = new Map()
  }
}

// Save favorites to localStorage
const saveFavorites = () => {
  try {
    const commits = Array.from(favoriteCommits.value.values())
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(commits))
    // Also update old format for backwards compatibility
    const favoriteArray = Array.from(favorites.value)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteArray))
  } catch (error) {
    console.error('Failed to save favorites to localStorage:', error)
  }
}

// Initialize favorites
loadFavorites()

// Watch for changes and save to localStorage
watch([favorites, favoriteCommits], () => {
  saveFavorites()
}, { deep: true })

export const useFavorites = () => {
  const isFavorite = (sha: string): boolean => {
    return favorites.value.has(sha)
  }

  const toggleFavorite = (sha: string, commitData?: FavoriteCommit): void => {
    if (favorites.value.has(sha)) {
      favorites.value.delete(sha)
      favoriteCommits.value.delete(sha)
    } else {
      favorites.value.add(sha)
      if (commitData) {
        favoriteCommits.value.set(sha, commitData)
      }
    }
  }

  const addFavorite = (sha: string, commitData?: FavoriteCommit): void => {
    favorites.value.add(sha)
    if (commitData) {
      favoriteCommits.value.set(sha, commitData)
    }
  }

  const removeFavorite = (sha: string): void => {
    favorites.value.delete(sha)
    favoriteCommits.value.delete(sha)
  }

  const getAllFavorites = (): string[] => {
    return Array.from(favorites.value)
  }

  const getAllFavoriteCommits = (): FavoriteCommit[] => {
    return Array.from(favoriteCommits.value.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  const getFavoriteCommit = (sha: string): FavoriteCommit | undefined => {
    return favoriteCommits.value.get(sha)
  }

  return {
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    getAllFavorites,
    getAllFavoriteCommits,
    getFavoriteCommit
  }
}

