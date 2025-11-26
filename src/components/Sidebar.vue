<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <!-- Sidebar Overlay -->
  <div
    v-if="isOpen"
    @click="handleClose"
    class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
  ></div>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out',
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
      <div class="flex-1 p-4 overflow-y-auto">
        <div class="text-center text-gray-400 mt-8">
          <p class="text-sm">No starred commits yet.</p>
          <p class="text-sm mt-1">Star commits to save them here.</p>
        </div>
      </div>
    </div>
  </aside>
</template>

