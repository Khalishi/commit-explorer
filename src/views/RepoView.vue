<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { githubApi } from '../services/githubApi'
import type { GitHubUser, GitHubRepository, GitHubCommit, GitHubCommitDetail } from '../types/github'
import TextInput from '../components/TextInput.vue'
import SecondaryButton from '../components/SecondaryButton.vue'
import RepositoryItem from '../components/RepositoryItem.vue'
import CommitHistory from '../components/CommitHistory.vue'

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
}

const handleCommitsLoaded = (loadedCommits: GitHubCommit[]) => {
  commits.value = loadedCommits
  if (commits.value.length > 0 && commits.value[0]) {
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
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch commit details'
  } finally {
    loadingCommitDetails.value = false
  }
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const goBack = () => {
  router.push('/')
}

const getShortSha = (sha: string) => {
  return sha.substring(0, 7)
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    await Promise.all([fetchUser(), fetchRepositories()])
    if (repositories.value.length > 0 && repositories.value[0]) {
      selectRepository(repositories.value[0])
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load data'
  } finally {
    loading.value = false
  }
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
      <!-- Left Panel: User Profile & Repositories -->
      <div class="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <!-- User Profile Card -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center gap-4 mb-4">
            <img 
              :src="user.avatar_url" 
              :alt="user.login"
              class="w-16 h-16 rounded-full"
            />
            <div>
              <h2 class="text-lg font-semibold text-gray-900">{{ user.name || user.login }}</h2>
              <p class="text-sm text-gray-500">@{{ user.login }}</p>
            </div>
          </div>
          <div class="flex gap-4 text-sm text-gray-600">
            <span>{{ user.followers }} followers</span>
            <span>{{ user.public_repos }} repos</span>
          </div>
        </div>

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
      <div class="w-96 bg-white flex flex-col overflow-hidden">
        <div class="p-4 border-b border-gray-200">
          <SecondaryButton @click="goBack" class="mb-4">
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </template>
            Back
          </SecondaryButton>
          <h2 class="text-lg font-semibold text-gray-900">
            {{ selectedCommit?.commit.message.split('\n')[0] || 'Select a commit' }}
          </h2>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="loadingCommitDetails" class="flex items-center justify-center py-12">
            <div class="text-gray-500">Loading commit details...</div>
          </div>
          <div v-else-if="selectedCommit" class="space-y-4">
            <!-- Commit Author & Date -->
            <div class="flex items-center gap-3">
              <img
                v-if="selectedCommit.author"
                :src="selectedCommit.author.avatar_url"
                :alt="selectedCommit.commit.author.name"
                class="w-10 h-10 rounded-full"
              />
              <div>
                <p class="font-semibold text-gray-900">{{ selectedCommit.commit.author.name }}</p>
                <p class="text-sm text-gray-500">{{ formatDateTime(selectedCommit.commit.author.date) }}</p>
              </div>
            </div>

            <!-- Commit Stats -->
            <div class="flex items-center gap-4 text-sm">
              <span class="text-green-600 font-semibold">+ {{ selectedCommit.stats.additions }} additions</span>
              <span class="text-red-600 font-semibold">{{ selectedCommit.stats.deletions }} deletions</span>
              <span class="text-gray-500 font-mono">{{ getShortSha(selectedCommit.sha) }}</span>
            </div>

            <!-- Changed Files -->
            <div v-if="selectedCommit.files && selectedCommit.files.length > 0">
              <h3 class="font-semibold text-gray-900 mb-3">
                CHANGED FILES ({{ selectedCommit.files.length }})
              </h3>
              <div class="space-y-2">
                <div
                  v-for="file in selectedCommit.files"
                  :key="file.filename"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span class="text-sm font-medium text-gray-900">{{ file.filename }}</span>
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-green-600">+{{ file.additions }}</span>
                    <span class="text-red-600">-{{ file.deletions }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="flex items-center justify-center py-12 text-gray-500">
            <p>Select a commit to view details</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
