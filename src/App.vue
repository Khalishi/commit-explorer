<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import SecondaryButton from './components/SecondaryButton.vue'
import Sidebar from './components/Sidebar.vue'
import GitHubLogo from './assets/GitHub_Logo.png'

const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
</script>

<template>
  <!-- Main layout -->
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <img :src="GitHubLogo" alt="GitHub Logo" class="h-8 w-auto" />
          </div>

          <!-- Favourites Button -->
          <SecondaryButton @click="toggleSidebar">
            <template #icon>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </template>
            Favourites
          </SecondaryButton>
        </div>
      </div>
    </header>

    <!-- Sidebar -->
    <Sidebar :is-open="isSidebarOpen" @close="closeSidebar" />

    <!-- Content -->
    <main class="container mx-auto p-4">
      <RouterView />
    </main>    
  </div>
</template>