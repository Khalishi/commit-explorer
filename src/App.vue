<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- Main layout -->
  <div class="min-h-screen"> 
    <!-- Content -->
    <main class="container mx-auto p-4">
      <RouterView />
    </main>    
  </div>
</template>