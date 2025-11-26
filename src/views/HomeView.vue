<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import GitHubMark from '../assets/github-mark.png'
import PrimaryButton from '../components/PrimaryButton.vue'

const router = useRouter()
const username = ref('')

const handleExplore = () => {
  if (username.value.trim()) {
    // Navigate to repositories page with username
    // For now, we'll just log it - you can update this route later
    router.push(`/user/${username.value.trim()}`)
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleExplore()
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 py-12">
    <!-- Icon Container -->
    <div class="mb-8">
      <img :src="GitHubMark" alt="GitHub Mark" class="w-20 h-20" />
    </div>

    <!-- Search Input and Button Container -->
    <div class="w-full max-w-md space-y-4">
      <!-- Input Field -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
        </div>
        <input
          v-model="username"
          @keypress="handleKeyPress"
          type="text"
          placeholder="Enter GitHub username..."
          class="w-full pl-12 pr-4 py-4 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Explore Button -->
      <PrimaryButton
        @click="handleExplore"
        :disabled="!username.trim()"
      >
        Explore Repositories
      </PrimaryButton>
    </div>
  </div>
</template>
