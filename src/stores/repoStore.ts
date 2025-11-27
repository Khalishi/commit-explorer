import { defineStore } from 'pinia'
import { githubApi } from '../services/githubApi'
import type {
  GitHubUser,
  GitHubRepository,
  GitHubCommit,
  GitHubCommitDetail,
} from '../types/github'

export interface RepoViewState {
  username: string
  user: GitHubUser | null
  repositories: GitHubRepository[]
  searchQuery: string
  selectedRepo: GitHubRepository | null
  commits: GitHubCommit[]
  selectedCommit: GitHubCommitDetail | null
  loading: boolean
  loadingCommitDetails: boolean
  error: string | null
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
    async initialize(username: string, shouldAutoSelectFirstRepo: boolean = false) {
      if (!username) {
        this.error = 'Username is required'
        return
      }

      this.username = username
      this.loading = true
      this.error = null

      try {
        const [user, repositories] = await Promise.all([
          githubApi.getUser(username),
          githubApi.getRepositories(username),
        ])

        this.user = user
        this.repositories = repositories

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

    selectRepository(repo: GitHubRepository | null) {
      this.selectedRepo = repo
      this.selectedCommit = null
      this.commits = []
    },

    clearSelection() {
      this.selectedRepo = null
      this.selectedCommit = null
      this.commits = []
    },

    setCommits(commits: GitHubCommit[]) {
      this.commits = commits
    },

    clearSelectedCommit() {
      this.selectedCommit = null
    },

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

