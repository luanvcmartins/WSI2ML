<template>
  <v-app>
    <slot />
  </v-app>
</template>
<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: "empty"
})
</script>
<style scoped></style>