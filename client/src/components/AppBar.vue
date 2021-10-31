<template>
  <v-app-bar app color="primary" dark dense>
    <v-btn v-if="$route.name==='session'" @click="$router.go(-1)" icon class="hidden-xs-only">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>
    <div class="d-flex align-center">
      <v-img
              alt="Vuetify Logo"
              class="shrink mr-2"
              contain
              src=""
              transition="scale-transition"
              width="40"
      />

      <v-toolbar-title>med-img-label</v-toolbar-title>
    </div>

    <v-spacer></v-spacer>

    <v-btn text>
      <span class="mr-2">Export</span>
      <v-icon>mdi-open-in-new</v-icon>
    </v-btn>
  </v-app-bar>
</template>

<script>
    export default {
        name: "AppBar"
    }
</script>

<style scoped>

</style>