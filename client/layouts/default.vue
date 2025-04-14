<template>
  <v-app>

    <v-app-bar app color="primary" dark>

      <v-toolbar-title>WSI2ML</v-toolbar-title>

      <v-spacer></v-spacer>

      <!--    <v-menu v-if="store.user != null" offset-y>-->
      <!--      <template v-slot:activator="{ on, attrs }">-->
      <!--        <v-card class="user-card"-->
      <!--                dark-->
      <!--                flat-->
      <!--                outlined-->
      <!--                color="primary lighten-1"-->
      <!--                v-bind="attrs"-->
      <!--                v-on="on">-->
      <!--          <v-card-text>-->
      <!--            <v-icon class="mr-1">mdi-dots-vertical-circle</v-icon>-->
      <!--&lt;!&ndash;            {{ store.user.name }}&ndash;&gt;-->
      <!--          </v-card-text>-->
      <!--        </v-card>-->
      <!--      </template>-->
      <!--      <v-list>-->
      <!--        <v-list-item @click="changePassword = true">-->
      <!--          <v-list-item-title>Change password</v-list-item-title>-->
      <!--        </v-list-item>-->
      <!--        <v-divider></v-divider>-->
      <!--        <v-list-item @click="logout">-->
      <!--          <v-list-item-title>Logout</v-list-item-title>-->
      <!--        </v-list-item>-->
      <!--      </v-list>-->
      <!--    </v-menu>-->

      <!--    <v-spacer></v-spacer>-->
      <template v-slot:extension>
        <v-tabs v-if="store.user != null" align-with-title>
          <!--        <v-tab v-if="access_overview" to="/overview">-->
          <!--          <span style="font-weight: 300">Overview</span>-->
          <!--        </v-tab>-->
          <v-tab to="/">Tasks</v-tab>
          <v-tab v-if="store.user.manages_users" to="/users">Users</v-tab>
          <v-tab v-if="store.user.manages_projects" to="/projects">Projects</v-tab>
          <!--        <v-tab v-if="manage_apps" to="/apps">Apps</v-tab>-->
          <!--        <v-tab v-if="can_export" to="/export">Export</v-tab>-->
          <!--        <v-tab v-if="is_admin" to="/admin">Management</v-tab>-->
        </v-tabs>
      </template>
      <!--    <ChangePassword v-if="changePassword" v-model="changePassword"/>-->
    </v-app-bar>

    <v-main>
      <slot/>
    </v-main>
  </v-app>
</template>
<script setup>

import { useAuthStore } from '../stores/auth.js';

const store = useAuthStore()
const { $axios } = useNuxtApp();

</script>
<style scoped>

.swal2-container {
  z-index: 5000 !important;
}
</style>