<script setup lang="ts">
defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    @click="$emit('click')"
    class="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 flex items-center gap-2"
  >
    <slot name="icon" />
    <slot />
  </button>
</template>

