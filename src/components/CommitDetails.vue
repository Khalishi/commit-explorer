<script setup lang="ts">
import type { GitHubCommitDetail } from '../types/github'

defineProps<{
  selectedCommit: GitHubCommitDetail | null
  loadingCommitDetails: boolean
  isFavorite?: boolean
}>()

const emit = defineEmits<{
  toggleFavorite: []
}>()

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

const getShortSha = (sha: string) => {
  return sha.substring(0, 7)
}

const handleToggleFavorite = () => {
  emit('toggleFavorite')
}
</script>

<template>
  <div class="w-full lg:w-96 bg-white flex flex-col overflow-hidden">
    <div class="p-3 lg:p-4 border-b border-gray-200">
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-base lg:text-lg font-semibold text-gray-900 flex-1 line-clamp-2">
          {{ selectedCommit?.commit.message.split('\n')[0] || 'Select a commit' }}
        </h2>
        <button
          v-if="selectedCommit"
          @click="handleToggleFavorite"
          :class="[
            'p-2 rounded-lg transition-colors touch-manipulation flex-shrink-0',
            isFavorite
              ? 'text-yellow-500 hover:bg-yellow-50 active:bg-yellow-100'
              : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-500 active:bg-gray-200'
          ]"
          :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
        >
          <svg class="w-5 h-5" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-3 lg:p-4">
      <div v-if="loadingCommitDetails" class="flex items-center justify-center py-12">
        <div class="text-gray-500 text-sm lg:text-base">Loading commit details...</div>
      </div>
      <div v-else-if="selectedCommit" class="space-y-4">
        <!-- Commit Author & Date -->
        <div class="flex items-center gap-3">
          <img
            v-if="selectedCommit.author"
            :src="selectedCommit.author.avatar_url"
            :alt="selectedCommit.commit.author.name"
            class="w-10 h-10 rounded-full flex-shrink-0"
          />
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-sm lg:text-base text-gray-900 truncate">{{ selectedCommit.commit.author.name }}</p>
            <p class="text-xs lg:text-sm text-gray-500">{{ formatDateTime(selectedCommit.commit.author.date) }}</p>
          </div>
        </div>

        <!-- Commit Stats -->
        <div class="flex items-center gap-3 lg:gap-4 text-xs lg:text-sm flex-wrap">
          <span class="text-green-600 font-semibold">+ {{ selectedCommit.stats.additions }} additions</span>
          <span class="text-red-600 font-semibold">{{ selectedCommit.stats.deletions }} deletions</span>
          <span class="text-gray-500 font-mono">{{ getShortSha(selectedCommit.sha) }}</span>
        </div>

        <!-- Changed Files -->
        <div v-if="selectedCommit.files && selectedCommit.files.length > 0">
          <h3 class="font-semibold text-sm lg:text-base text-gray-900 mb-3">
            CHANGED FILES ({{ selectedCommit.files.length }})
          </h3>
          <div class="space-y-2">
            <div
              v-for="file in selectedCommit.files"
              :key="file.filename"
              class="flex items-center justify-between p-2 lg:p-3 bg-gray-50 rounded-lg border border-gray-200 gap-2"
            >
              <span class="text-xs lg:text-sm font-medium text-gray-900 truncate min-w-0 flex-1">{{ file.filename }}</span>
              <div class="flex items-center gap-2 text-xs lg:text-sm flex-shrink-0">
                <span class="text-green-600">+{{ file.additions }}</span>
                <span class="text-red-600">-{{ file.deletions }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="flex items-center justify-center py-12 text-gray-500">
        <p class="text-sm lg:text-base">Select a commit to view details</p>
      </div>
    </div>
  </div>
</template>

