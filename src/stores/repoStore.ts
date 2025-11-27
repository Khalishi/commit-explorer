/**
 * Repository Store
 * 
 * This Pinia store manages all GitHub repository-related state and operations.
 * It handles:
 * - Loading user information and their repositories
 * - Selecting and displaying repository details
 * - Fetching and managing commit history
 * - Filtering repositories by search query
 */
import { defineStore } from 'pinia'
import { githubApi } from '../services/githubApi'
import type {
  GitHubUser,
  GitHubRepository,
  GitHubCommit,
  GitHubCommitDetail,
} from '../types/github'

/**
 * State interface for the repository store
 */
export interface RepoViewState {
  /** The GitHub username being viewed */
  username: string
  /** The GitHub user profile information */
  user: GitHubUser | null
  /** List of all repositories for the user */
  repositories: GitHubRepository[]
  /** Search query for filtering repositories */
  searchQuery: string
  /** Currently selected repository */
  selectedRepo: GitHubRepository | null
  /** List of commits for the selected repository */
  commits: GitHubCommit[]
  /** Detailed information about the currently selected commit */
  selectedCommit: GitHubCommitDetail | null
  /** Whether user/repositories are currently being loaded */
  loading: boolean
  /** Whether commit details are currently being loaded */
  loadingCommitDetails: boolean
  /** Error message if any operation fails */
  error: string | null
  /** Whether the store has been initialized with data */
  initialized: boolean
}

export const useRepoStore = defineStore('repo', {
  state: (): RepoViewState => ({
    username: '',
    user: null,
    repositories: [],
    searchQuery: '',
    selectedRepo: null,
    commits: [],
    selectedCommit: null,
    loading: false,
    loadingCommitDetails: false,
    error: null,
    initialized: false,
  }),

  getters: {
    /**
     * Filters repositories based on the search query
     * Searches both repository name and description (case-insensitive)
     * Returns all repositories if search query is empty
     */
    filteredRepos: (state): GitHubRepository[] => {
      if (!state.searchQuery.trim()) {
        return state.repositories
      }

      const query = state.searchQuery.toLowerCase()
      return state.repositories.filter(repo => {
        const nameMatches = repo.name.toLowerCase().includes(query)
        const descriptionMatches = repo.description
          ? repo.description.toLowerCase().includes(query)
          : false
        return nameMatches || descriptionMatches
      })
    },
  },

  actions: {
    /**
     * Initializes the store by loading user information and repositories
     * 
     * @param username - GitHub username to load data for
     * @param shouldAutoSelectFirstRepo - If true, automatically selects the first repository
     * 
     * Fetches user profile and repositories in parallel for better performance.
     * Sets error state if username is missing or API calls fail.
     */
    async initialize(username: string, shouldAutoSelectFirstRepo: boolean = false) {
      if (!username) {
        this.error = 'Username is required'
        return
      }

      this.username = username
      this.loading = true
      this.error = null

      try {
        // Fetch user and repositories in parallel for faster loading
        const [user, repositories] = await Promise.all([
          githubApi.getUser(username),
          githubApi.getRepositories(username),
        ])

        this.user = user
        this.repositories = repositories

        // Optionally auto-select the first repository
        if (shouldAutoSelectFirstRepo && repositories.length > 0) {
          const firstRepository = repositories[0]
          if (firstRepository) {
            this.selectRepository(firstRepository)
          }
        } else {
          this.clearSelection()
        }
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : 'Failed to load repository data'
        this.user = null
        this.repositories = []
        this.clearSelection()
      } finally {
        this.loading = false
        this.initialized = true
      }
    },

    /**
     * Selects a repository and clears any previously selected commit
     * 
     * @param repo - The repository to select, or null to deselect
     */
    selectRepository(repo: GitHubRepository | null) {
      this.selectedRepo = repo
      this.selectedCommit = null
      this.commits = []
    },

    /**
     * Clears all selections (repository, commit, and commits list)
     * Useful for resetting the state
     */
    clearSelection() {
      this.selectedRepo = null
      this.selectedCommit = null
      this.commits = []
    },

    /**
     * Sets the list of commits for the selected repository
     * 
     * @param commits - Array of commit objects to set
     */
    setCommits(commits: GitHubCommit[]) {
      this.commits = commits
    },

    /**
     * Clears the currently selected commit (but keeps the commits list)
     */
    clearSelectedCommit() {
      this.selectedCommit = null
    },

    /**
     * Fetches and selects detailed information for a specific commit
     * 
     * @param sha - The commit SHA (hash) to fetch details for
     * 
     * Requires a selected repository. Shows loading state while fetching.
     * Sets error state if the fetch fails.
     */
    async selectCommit(sha: string) {
      if (!this.selectedRepo) {
        return
      }

      this.loadingCommitDetails = true
      this.error = null

      try {
        this.selectedCommit = await githubApi.getCommitDetails(
          this.username,
          this.selectedRepo.name,
          sha
        )
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : 'Failed to fetch commit details'
      } finally {
        this.loadingCommitDetails = false
      }
    },
  },
})

