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



      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-list-item v-if="currentProject != null"  >
            <v-list-item-title>{{ currentProject.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ currentProject.description }}</v-list-item-subtitle>
          </v-list-item>

          <v-btn v-bind="props" class="ma-1 rounded-lg">{{ store.user.name }}</v-btn>
        </template>

        <v-list>
          <v-list-item @click="changePasswordScreen = true">Change password</v-list-item>
          <v-list-item @click="logout">Logout</v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-dialog v-model="changePasswordScreen" max-width="400">
      <v-card title="Change Password" subtitle="Enter your new password for your account.">
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="password.oldPassword"
              label="Old Password"
              type="password"
              required
            ></v-text-field>
            <v-text-field
              v-model="password.newPassword"
              label="New Password"
              type="password"
              required
            ></v-text-field>
            <v-text-field
              v-model="password.confirmPassword"
              label="Confirm New Password"
              type="password"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="changePassword">Submit</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-main>
      <slot/>
    </v-main>
  </v-app>
</template>
<script setup>

import Swal from 'sweetalert2';
import { useAuthStore } from '../stores/auth.js';

const store = useAuthStore();
const { $axios } = useNuxtApp();
const navDrawer = ref(true);

const changePasswordScreen = ref(false);
const password = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

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

function changePassword() {
  if (password.newPassword !== password.confirmPassword) {
    Swal.fire({
      icon: 'warning',
      title: 'Passwords do not match',
      text: "Please try again.",
    });
    return;
  }
  $axios.post('/user/change_password', password)
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Password changed successfully',
          text: "Please log in again to apply changes.",
        });
        changePasswordScreen.value = false;
        password.oldPassword = '';
        password.newPassword = '';
        password.confirmPassword = '';
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error changing password',
          text: "Please try again later. If the problem persists, contact administrator.",
        });
      });
}

function logout(){
  window.location.href = '/';
}

function loadProjects() {
  $axios.get('/project/quick_list')
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