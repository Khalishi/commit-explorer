import { ref, watch } from 'vue'

const STORAGE_KEY = 'github-commit-favorites'
const favorites = ref<Set<string>>(new Set())

// Load favorites from localStorage on initialization
const loadFavorites = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const favoriteArray = JSON.parse(stored) as string[]
      favorites.value = new Set(favoriteArray)
    }
  } catch (error) {
    console.error('Failed to load favorites from localStorage:', error)
    favorites.value = new Set()
  }
}

// Save favorites to localStorage
const saveFavorites = () => {
  try {
    const favoriteArray = Array.from(favorites.value)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteArray))
  } catch (error) {
    console.error('Failed to save favorites to localStorage:', error)
  }
}

// Initialize favorites
loadFavorites()

// Watch for changes and save to localStorage
watch(favorites, () => {
  saveFavorites()
}, { deep: true })

export const useFavorites = () => {
  const isFavorite = (sha: string): boolean => {
    return favorites.value.has(sha)
  }

  const toggleFavorite = (sha: string): void => {
    if (favorites.value.has(sha)) {
      favorites.value.delete(sha)
    } else {
      favorites.value.add(sha)
    }
  }

  const addFavorite = (sha: string): void => {
    favorites.value.add(sha)
  }

  const removeFavorite = (sha: string): void => {
    favorites.value.delete(sha)
  }

  const getAllFavorites = (): string[] => {
    return Array.from(favorites.value)
  }

  return {
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    getAllFavorites
  }
}

