<script setup lang="ts">
import { computed } from 'vue'
import type { GitHubUser } from '../types/github'

const props = withDefaults(defineProps<{
  user: GitHubUser
  variant?: 'desktop' | 'mobile'
}>(), {
  variant: 'desktop'
})

const variantConfig = {
  desktop: {
    containerPadding: 'p-6',
    avatarSize: 'w-16 h-16',
    gap: 'gap-4',
    nameSize: 'text-lg',
    usernameSize: 'text-sm',
    statsGap: 'gap-4',
    statsText: 'text-sm'
  },
  mobile: {
    containerPadding: 'p-4',
    avatarSize: 'w-12 h-12',
    gap: 'gap-3',
    nameSize: 'text-base',
    usernameSize: 'text-xs',
    statsGap: 'gap-3',
    statsText: 'text-xs'
  }
} as const

const config = computed(() => variantConfig[props.variant])
</script>

<template>
  <div class="border-b border-gray-200" :class="config.containerPadding">
    <div class="flex items-center mb-3" :class="config.gap">
      <img
        :src="user.avatar_url"
        :alt="user.login"
        class="rounded-full"
        :class="config.avatarSize"
      />
      <div>
        <h2 class="font-semibold text-gray-900" :class="config.nameSize">
          {{ user.name || user.login }}
        </h2>
        <p class="text-gray-500" :class="config.usernameSize">
          @{{ user.login }}
        </p>
      </div>
    </div>
    <div class="flex text-gray-600" :class="[config.statsGap, config.statsText]">
      <span>{{ user.followers }} followers</span>
      <span>{{ user.public_repos }} repos</span>
    </div>
  </div>
</template>

