<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import type { GitHubCommitDetail } from '../types/github'
import SecondaryButton from './SecondaryButton.vue'

const props = defineProps<{
  selectedCommit: GitHubCommitDetail | null
  loadingCommitDetails: boolean
}>()

const emit = defineEmits<{
  goBack: []
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

const handleGoBack = () => {
  emit('goBack')
}
</script>

<template>
  <div class="w-96 bg-white flex flex-col overflow-hidden">
    <div class="p-4 border-b border-gray-200">
      <SecondaryButton @click="handleGoBack" class="mb-4">
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
</template>

