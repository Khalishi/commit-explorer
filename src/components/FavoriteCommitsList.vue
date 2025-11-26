<script setup lang="ts">
import type { FavoriteCommit } from '../types/github'

defineProps<{
  commits: FavoriteCommit[]
}>()

const emit = defineEmits<{
  commitClick: [commit: FavoriteCommit]
  removeFavorite: [sha: string]
}>()

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getShortSha = (sha: string) => {
  return sha.substring(0, 7)
}

const handleCommitClick = (commit: FavoriteCommit) => {
  emit('commitClick', commit)
}

const handleRemoveFavorite = (event: MouseEvent, sha: string) => {
  event.stopPropagation()
  emit('removeFavorite', sha)
}
</script>

<template>
  <div class="flex-1 p-4 overflow-y-auto">
    <div v-if="commits.length === 0" class="text-center text-gray-400 mt-8">
      <p class="text-sm">No starred commits yet.</p>
      <p class="text-sm mt-1">Star commits to save them here.</p>
    </div>
    
    <div v-else class="space-y-3">
      <div
        v-for="commit in commits"
        :key="commit.sha"
        @click="handleCommitClick(commit)"
        class="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors group"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-mono text-xs text-gray-500">{{ getShortSha(commit.sha) }}</span>
              <button
                @click="handleRemoveFavorite($event, commit.sha)"
                class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-yellow-50 rounded"
                title="Remove from favorites"
              >
                <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            </div>
            <h3 class="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
              {{ commit.message }}
            </h3>
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span>{{ commit.repositoryName }}</span>
              <span>•</span>
              <span>{{ commit.authorName }}</span>
              <span>•</span>
              <span>{{ formatDate(commit.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

