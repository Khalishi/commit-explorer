<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFavorites } from '../composables/useFavorites'
import type { FavoriteCommit } from '../types/github'
import FavoriteCommitsList from './FavoriteCommitsList.vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const { getAllFavoriteCommits, removeFavorite } = useFavorites()

const favoriteCommits = computed(() => getAllFavoriteCommits())

const handleClose = () => {
  emit('close')
}

const handleCommitClick = (commit: FavoriteCommit) => {
  router.push(`/repos/${commit.username}`)
  handleClose()
  // TODO: Navigate to specific commit view
}

const handleRemoveFavorite = (sha: string) => {
  removeFavorite(sha)
}
</script>

<template>
  <!-- Sidebar Overlay -->
  <div
    v-if="isOpen"
    @click="handleClose"
    class="fixed inset-0 bg-transparent z-40 transition-opacity duration-300"
  ></div>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed top-0 right-0 h-full w-80 bg-blue-50 shadow-xl z-50 transform transition-transform duration-300 ease-in-out',
      isOpen ? 'translate-x-0' : 'translate-x-full'
    ]"
  >
    <div class="flex flex-col h-full">
      <!-- Sidebar Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 class="text-xl font-bold text-gray-800">Saved Commits</h2>
        <button
          @click="handleClose"
          class="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Sidebar Content -->
      <FavoriteCommitsList
        :commits="favoriteCommits"
        @commit-click="handleCommitClick"
        @remove-favorite="handleRemoveFavorite"
      />
    </div>
  </aside>
</template>

