<template>
  <v-app>

    <v-navigation-drawer
        class="bg-deep-purple"
        theme="dark"
        v-model="navDrawer"
    >
      <div class="d-flex justify-center align-center" style="height: 80px;">
        <span class="app-title">WSI <strong style="color: darkorange;">//</strong> ML</span>
      </div>
      <v-list>
        <v-list-item class="ma-1 rounded-lg" to="/" title="Welcome"
                     prepend-icon="mdi-view-dashboard"></v-list-item>
        <v-divider v-if="projectId != null" class="mt-2 mb-2"/>
        <v-list-item
            class="ma-1 rounded-lg"
            :to="`/${projectId}/`"
            v-if="projectId != null"
            title="All tasks" prepend-icon="mdi-view-dashboard-variant"></v-list-item>
        <v-list-item
            class="ma-1 rounded-lg"
            :to="`/${projectId}/export`"
            v-if="projectId != null && store.user.can_export"
            title="Download dataset"
            prepend-icon="mdi-download"/>
        <v-list-item
            class="ma-1 rounded-lg"
            :to="`/${projectId}/import`"
            v-if="projectId != null && store.user.can_export"
            title="Upload ML artifacts"
            prepend-icon="mdi-upload"/>
        <v-list-item
            class="ma-1 rounded-lg"
            :to="`/${projectId}/progress`"
            v-if="projectId != null && store.user.access_overview"
            title="Progress" prepend-icon="mdi-trending-up"></v-list-item>
        <v-divider class="mt-2 mb-2"/>
        <v-list-item class="ma-1 rounded-lg" to="/users" v-if="store.user.manages_users"
                     prepend-icon="mdi-account-multiple" title="Users"/>
        <v-list-item class="ma-1 rounded-lg" to="/projects" v-if="store.user.manages_projects" title="Projects"
                     prepend-icon="mdi-folder"/>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar>
      <v-app-bar-nav-icon @click="navDrawer = !navDrawer"/>


      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-list-item v-if="currentProject != null" v-bind="props" class="ma-1 rounded-lg">
            <v-list-item-title>{{ currentProject.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ currentProject.description }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item v-else v-bind="props" class="ma-1 rounded-lg">
            <v-list-item-title>Select a project</v-list-item-title>
            <v-list-item-subtitle>Select a project to continue</v-list-item-subtitle>
          </v-list-item>
        </template>

        <v-list>
          <v-list-item v-for="project in projects" :to="`/${project._id}/`">
            <v-list-item-title>{{ project.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ project.description }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-spacer/>
      <!--      <span style="font-size: 1.5rem; font-weight: bold; color: white; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);">WSI <strong-->
      <!--          style="color: darkorange;">//</strong> ML</span>-->


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
      <!--    <ChangePassword v-if="changePassword" v-model="changePassword"/>-->
    </v-app-bar>


    <v-main>
      <slot/>
    </v-main>
  </v-app>
</template>
<script setup>

import { useAuthStore } from '../stores/auth.js';

const store = useAuthStore();
const { $axios } = useNuxtApp();
const navDrawer = ref(true);

const route = useRoute();
const projectId = computed(() => {
  return route.params.project_id;
});
const currentProject = computed(() => {
  if (projectId != null) {
    return projects.value.find(p => p._id === projectId.value);
  }
  return null;
});
const projects = ref([]);

function loadProjects() {
  $axios.get('/project/list')
      .then((res) => {
        projects.value = res.data;
      })
      .catch((err) => {
        console.log(err);
      });
}

loadProjects();
</script>
<style scoped>

.swal2-container {
  z-index: 5000 !important;
}


@keyframes gradientAnimation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.app-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  background: linear-gradient(270deg, orange, white, white);
  background-size: 600% 600%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientAnimation 6s ease infinite;
  animation-delay: 5s;
}
</style>