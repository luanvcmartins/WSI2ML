<template>
  <NuxtLayout>
    <NuxtPage/>
  </NuxtLayout>
</template>

<script setup>
import { useTheme } from 'vuetify'
import {onMounted} from "vue";

const theme = useTheme()
let color_theme = ref("dark")

function updateMode() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    color_theme.value = 'dark'
  } else {
    color_theme.value = 'light'

  }
  theme.global.name.value = color_theme.value  //theme.global.current.value.dark ? 'light' : 'dark'
}


onMounted(() => {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateMode);
  updateMode()
})
</script>

<style>
.swal2-container {
  z-index: 5000 !important;
}
</style>