<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { githubApi } from '../services/githubApi'
import type { GitHubUser, GitHubRepository, GitHubCommit, GitHubCommitDetail } from '../types/github'
import TextInput from '../components/TextInput.vue'
import RepositoryItem from '../components/RepositoryItem.vue'
import CommitHistory from '../components/CommitHistory.vue'
import CommitDetails from '../components/CommitDetails.vue'
import UserProfileCard from '../components/UserProfileCard.vue'

const route = useRoute()
const router = useRouter()
const username = ref<string>(route.params.username as string)

// State
const user = ref<GitHubUser | null>(null)
const repositories = ref<GitHubRepository[]>([])
const searchQuery = ref<string>('')
const selectedRepo = ref<GitHubRepository | null>(null)
const commits = ref<GitHubCommit[]>([])
const selectedCommit = ref<GitHubCommitDetail | null>(null)
const loading = ref<boolean>(true)
const loadingCommitDetails = ref<boolean>(false)
const error = ref<string | null>(null)
const mobileView = ref<'repos' | 'commits' | 'details'>('repos')
const isDesktop = ref<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false)

// Computed
const filteredRepos = computed(() => {
  if (!searchQuery.value.trim()) {
    return repositories.value
  }
  const query = searchQuery.value.toLowerCase()
  return repositories.value.filter(repo => 
    repo.name.toLowerCase().includes(query) ||
    (repo.description && repo.description.toLowerCase().includes(query))
  )
})

// Methods
const fetchUser = async () => {
  try {
    user.value = await githubApi.getUser(username.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch user profile'
  }
}

const fetchRepositories = async () => {
  try {
    repositories.value = await githubApi.getRepositories(username.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch repositories'
  }
}

const selectRepository = async (repo: GitHubRepository) => {
  selectedRepo.value = repo
  selectedCommit.value = null
  commits.value = []
  if (!isDesktop.value) {
    mobileView.value = 'commits'
  }
}

const handleCommitsLoaded = (loadedCommits: GitHubCommit[]) => {
  commits.value = loadedCommits
  if (isDesktop.value && commits.value.length > 0 && commits.value[0]) {
    selectCommit(commits.value[0].sha)
  }
}

const selectCommit = async (sha: string) => {
  if (!selectedRepo.value) return
  
  loadingCommitDetails.value = true
  try {
    selectedCommit.value = await githubApi.getCommitDetails(
      username.value,
      selectedRepo.value.name,
      sha
    )
    if (!isDesktop.value) {
      mobileView.value = 'details'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch commit details'
  } finally {
    loadingCommitDetails.value = false
  }
}

const goBackToRepos = () => {
  mobileView.value = 'repos'
  selectedRepo.value = null
  selectedCommit.value = null
  commits.value = []
}

const goBackToCommits = () => {
  mobileView.value = 'commits'
  selectedCommit.value = null
}

const goBack = () => {
  router.push('/')
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    await Promise.all([fetchUser(), fetchRepositories()])
    // Only auto-select on desktop (lg breakpoint and above)
    // On mobile, user should manually select a repo
    if (window.innerWidth >= 1024 && repositories.value.length > 0 && repositories.value[0]) {
      selectRepository(repositories.value[0])
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load data'
  } finally {
    loading.value = false
  }
})

const handleResize = () => {
  isDesktop.value = window.innerWidth >= 1024
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-gray-500">Loading...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="rounded-lg bg-red-50 border border-red-200 p-4">
        <div class="flex items-center gap-2 text-red-800">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ error }}</span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="user" class="flex h-screen overflow-hidden">
      <!-- Desktop Layout: All panels side by side -->
      <div class="hidden lg:flex flex-1 h-full">
        <!-- Left Panel: User Profile & Repositories -->
        <div class="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <!-- User Profile Card -->
          <UserProfileCard :user="user" variant="desktop" />

          <!-- Search Bar -->
          <div class="p-4 border-b border-gray-200">
            <TextInput
              v-model="searchQuery"
              placeholder="Find a repository..."
            >
            <template #icon>
            <svg 
              class="w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </template>
          </TextInput>
          </div>

          <!-- Repositories List -->
          <div class="flex-1 overflow-y-auto">
            <RepositoryItem
              v-for="repo in filteredRepos"
              :key="repo.id"
              :repository="repo"
              :is-selected="selectedRepo?.id === repo.id"
              @select="selectRepository"
            />
          </div>
        </div>

        <!-- Middle Panel: Commit History -->
        <CommitHistory
          :username="username"
          :repository-name="selectedRepo?.name || null"
          :selected-commit-sha="selectedCommit?.sha || null"
          @commit-selected="selectCommit"
          @commits-loaded="handleCommitsLoaded"
        />

        <!-- Right Panel: Commit Details -->
        <CommitDetails
          :selected-commit="selectedCommit"
          :loading-commit-details="loadingCommitDetails"
          @go-back="goBack"
        />
      </div>

      <!-- Mobile Layout: One view at a time -->
      <div class="lg:hidden flex-1 h-full overflow-hidden">
        <!-- Repositories View -->
        <div v-if="mobileView === 'repos'" class="h-full bg-white flex flex-col overflow-hidden">
          <!-- User Profile Card -->
          <UserProfileCard :user="user" variant="mobile" />

          <!-- Search Bar -->
          <div class="p-3 border-b border-gray-200">
            <TextInput
              v-model="searchQuery"
              placeholder="Find a repository..."
            >
            <template #icon>
            <svg 
              class="w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </template>
          </TextInput>
          </div>

          <!-- Repositories List -->
          <div class="flex-1 overflow-y-auto">
            <RepositoryItem
              v-for="repo in filteredRepos"
              :key="repo.id"
              :repository="repo"
              :is-selected="selectedRepo?.id === repo.id"
              @select="selectRepository"
            />
          </div>
        </div>

        <!-- Commits View -->
        <div v-else-if="mobileView === 'commits'" class="h-full">
          <CommitHistory
            :username="username"
            :repository-name="selectedRepo?.name || null"
            :selected-commit-sha="selectedCommit?.sha || null"
            @commit-selected="selectCommit"
            @commits-loaded="handleCommitsLoaded"
            @go-back="goBackToRepos"
          />
        </div>

        <!-- Commit Details View -->
        <div v-else-if="mobileView === 'details'" class="h-full">
          <CommitDetails
            :selected-commit="selectedCommit"
            :loading-commit-details="loadingCommitDetails"
            @go-back="goBackToCommits"
          />
        </div>
      </div>
    </div>
  </div>
</template>
