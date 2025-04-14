<template>
  <v-container>
  </v-container>
</template>
<script>
import {defineComponent} from 'vue'

import GLHost from '~/components/GLHost.vue';

definePageMeta({
  middleware: 'auth',
  name: "index",
  layout: "default"
})
//
// export default defineComponent({
//   name: "Welcome",
//   layout: "default",
//   middleware: "auth",
// })
</script>

<style scoped>

</style>