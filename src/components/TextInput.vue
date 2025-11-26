<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
  keypress: [event: KeyboardEvent]
}>()
</script>

<template>
  <div class="relative">
    <div v-if="$slots.icon" class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <slot name="icon" />
    </div>
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keypress="$emit('keypress', $event)"
      type="text"
      :placeholder="placeholder"
      :class="[
        'w-full pr-4 py-4 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        $slots.icon ? 'pl-12' : 'pl-4'
      ]"
    />
  </div>
</template>

