<script setup lang="ts">
import { ref, watch } from 'vue'
import { githubApi } from '../services/githubApi'
import type { GitHubCommit, GitHubCommitDetail } from '../types/github'

const props = defineProps<{
  username: string
  repositoryName: string | null
  selectedCommitSha?: string | null
}>()

const emit = defineEmits<{
  commitSelected: [sha: string]
  commitsLoaded: [commits: GitHubCommit[]]
}>()

const commits = ref<GitHubCommit[]>([])
const loading = ref<boolean>(false)
const error = ref<string | null>(null)

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })
}

const getShortSha = (sha: string) => {
  return sha.substring(0, 7)
}

const fetchCommits = async () => {
  if (!props.repositoryName) {
    commits.value = []
    return
  }

  loading.value = true
  error.value = null
  
  try {
    commits.value = await githubApi.getCommits(props.username, props.repositoryName)
    emit('commitsLoaded', commits.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch commits'
    commits.value = []
  } finally {
    loading.value = false
  }
}

const handleCommitClick = (sha: string) => {
  emit('commitSelected', sha)
}

// Watch for repository changes
watch(() => props.repositoryName, () => {
  fetchCommits()
}, { immediate: true })
</script>

<template>
  <div class="flex-1 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">
        {{ repositoryName || 'Select a repository' }} commits
      </h2>
    </div>
    
    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-gray-500">Loading commits...</div>
      </div>
      <div v-else-if="error" class="flex items-center justify-center py-12">
        <div class="text-red-500">{{ error }}</div>
      </div>
      <div v-else-if="commits.length === 0" class="flex items-center justify-center py-12">
        <div class="text-gray-500">No commits found</div>
      </div>
      <div v-else class="space-y-2">
        <!-- Commit Timeline Visualization -->
        <div class="relative">
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
          <div
            v-for="commit in commits"
            :key="commit.sha"
            @click="handleCommitClick(commit.sha)"
            :class="[
              'relative pl-12 py-3 cursor-pointer rounded-lg transition-colors',
              selectedCommitSha === commit.sha 
                ? 'bg-blue-50 border border-blue-200' 
                : 'hover:bg-gray-50'
            ]"
          >
            <div class="absolute left-3 top-5 w-2 h-2 rounded-full bg-blue-500 border-2 border-white"></div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono text-sm text-gray-600">{{ getShortSha(commit.sha) }}</span>
              <button
                v-if="selectedCommitSha === commit.sha"
                class="text-gray-400 hover:text-gray-600"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">{{ commit.commit.message.split('\n')[0] }}</h3>
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <span>{{ commit.commit.author.name }}</span>
              <span>•</span>
              <span>{{ formatDate(commit.commit.author.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

