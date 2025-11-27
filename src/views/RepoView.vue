<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import type { GitHubRepository, GitHubCommit, FavoriteCommit } from '../types/github'
import TextInput from '../components/TextInput.vue'
import RepositoryItem from '../components/RepositoryItem.vue'
import CommitHistory from '../components/CommitHistory.vue'
import CommitDetails from '../components/CommitDetails.vue'
import UserProfileCard from '../components/UserProfileCard.vue'
import { useFavorites } from '../stores/useFavorites'
import { useRepoStore } from '../stores/repoStore'

type MobileView = 'repos' | 'commits' | 'details'

const route = useRoute()
const router = useRouter()
const repoStore = useRepoStore()
const {
  username,
  user,
  searchQuery,
  selectedRepo,
  selectedCommit,
  commits,
  loading,
  loadingCommitDetails,
  error,
  filteredRepos,
} = storeToRefs(repoStore)
const mobileView = ref<MobileView>('repos')
const isDesktop = ref<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false)
const favoritesStore = useFavorites()
const isFavorite = (sha: string) => favoritesStore.isFavorite(sha)

const initializeForUsername = async (usernameParam: unknown) => {
  if (typeof usernameParam !== 'string' || !usernameParam.trim()) {
    repoStore.clearSelection()
    return
  }

  repoStore.$reset()
  await repoStore.initialize(usernameParam, isDesktop.value)
  mobileView.value = 'repos'
}

const handleSelectRepository = (repo: GitHubRepository) => {
  repoStore.selectRepository(repo)
  if (!isDesktop.value) {
    mobileView.value = 'commits'
  }
}

const handleSelectCommit = async (sha: string) => {
  await repoStore.selectCommit(sha)
  if (!isDesktop.value) {
    mobileView.value = 'details'
  }
}

const handleCommitsLoaded = (loadedCommits: GitHubCommit[]) => {
  repoStore.setCommits(loadedCommits)
  if (isDesktop.value && loadedCommits.length > 0) {
    const [firstCommit] = loadedCommits
    if (firstCommit) {
      void handleSelectCommit(firstCommit.sha)
    }
  }
}

const buildFavoriteCommitPayload = (sha: string): FavoriteCommit | null => {
  if (!selectedRepo.value) return null
  const matchingCommit =
    commits.value.find(commit => commit.sha === sha) ||
    (selectedCommit.value && selectedCommit.value.sha === sha ? selectedCommit.value : null)

  if (!matchingCommit) return null

  const commitMessageLine = matchingCommit.commit.message.split('\n')[0] ?? ''
  const commitMessage = commitMessageLine.trim() || 'Untitled commit'
  const commitAuthor = matchingCommit.commit.author || matchingCommit.commit.committer
  const commitDate = commitAuthor?.date || matchingCommit.commit.committer?.date || new Date().toISOString()
  const authorName = commitAuthor?.name || matchingCommit.commit.committer?.name || 'Unknown author'

  return {
    sha: matchingCommit.sha,
    username: username.value,
    repositoryName: selectedRepo.value.name,
    message: commitMessage,
    date: commitDate,
    authorName,
    authorAvatar: matchingCommit.author?.avatar_url || undefined,
    html_url: matchingCommit.html_url
  }
}

const handleToggleFavorite = (sha: string) => {
  if (favoritesStore.isFavorite(sha)) {
    favoritesStore.toggleFavorite(sha)
    return
  }

  const payload = buildFavoriteCommitPayload(sha)
  if (payload) {
    favoritesStore.toggleFavorite(sha, payload)
  }
}

const handleToggleFavoriteFromDetails = () => {
  if (!selectedCommit.value) return
  handleToggleFavorite(selectedCommit.value.sha)
}

const goBackToRepos = () => {
  mobileView.value = 'repos'
  repoStore.clearSelection()
}

const goBackToCommits = () => {
  mobileView.value = 'commits'
  repoStore.clearSelectedCommit()
}

const goBack = () => {
  router.push('/')
}

const handleResize = () => {
  if (typeof window === 'undefined') {
    return
  }

  const wasDesktop = isDesktop.value
  isDesktop.value = window.innerWidth >= 1024

  if (isDesktop.value) {
    mobileView.value = 'repos'
    if (!wasDesktop && !selectedRepo.value && filteredRepos.value.length > 0) {
      const firstRepo = filteredRepos.value[0]
      if (firstRepo) {
        repoStore.selectRepository(firstRepo)
      }
    }
  }
}

onMounted(() => {
  void initializeForUsername(route.params.username)
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
  repoStore.$reset()
})

watch(
  () => route.params.username,
  newUsername => {
    void initializeForUsername(newUsername)
  }
)
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
              @select="handleSelectRepository"
            />
          </div>
        </div>

        <!-- Middle Panel: Commit History -->
        <CommitHistory
          :username="username"
          :repository-name="selectedRepo?.name || null"
          :selected-commit-sha="selectedCommit?.sha || null"
          :is-favorite="isFavorite"
          @commit-selected="handleSelectCommit"
          @commits-loaded="handleCommitsLoaded"
          @toggle-favorite="handleToggleFavorite"
        />

        <!-- Right Panel: Commit Details -->
        <CommitDetails
          :selected-commit="selectedCommit"
          :loading-commit-details="loadingCommitDetails"
          :is-favorite="selectedCommit ? isFavorite(selectedCommit.sha) : false"
          @toggle-favorite="handleToggleFavoriteFromDetails"
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
              @select="handleSelectRepository"
            />
          </div>
        </div>

        <!-- Commits View -->
        <div v-else-if="mobileView === 'commits'" class="h-full">
          <CommitHistory
            :username="username"
            :repository-name="selectedRepo?.name || null"
            :selected-commit-sha="selectedCommit?.sha || null"
            :is-favorite="isFavorite"
            @commit-selected="handleSelectCommit"
            @commits-loaded="handleCommitsLoaded"
            @toggle-favorite="handleToggleFavorite"
            @go-back="goBackToRepos"
          />
        </div>

        <!-- Commit Details View -->
        <div v-else-if="mobileView === 'details'" class="h-full">
          <CommitDetails
            :selected-commit="selectedCommit"
            :loading-commit-details="loadingCommitDetails"
            :is-favorite="selectedCommit ? isFavorite(selectedCommit.sha) : false"
            @toggle-favorite="handleToggleFavoriteFromDetails"
            @go-back="goBackToCommits"
          />
        </div>
      </div>
    </div>
  </div>
</template>
