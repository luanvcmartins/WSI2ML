<template>
  <v-container>
    <v-expansion-panels>
      <v-expansion-panel-title @click="newProject" v-slot="{ expanded }">
        <v-icon icon="mdi-plus" class="mr-3"></v-icon>
        New project
      </v-expansion-panel-title>

      <!-- PROJECTS -->

      <v-expansion-panel v-for="project in projects">
        <v-expansion-panel-title v-slot="{ expanded }">
          {{ project.name }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row justify="start">
            <v-col cols="12">
              <span class="text-h4">{{ project.name }}</span>
            </v-col>
            <v-col cols="12">
              <span class="text-body-1">{{ project.description }}</span>
            </v-col>
            <v-divider class="mt-2 mb-2" />
            <div class="d-flex flex-wrap gap-2 mt-4">
              <v-card class="ma-1" v-for="label in project.labels" :title="label.name" :key="label._id" :color="label.color">
                <template v-slot:prepend>
                  <v-btn variant="plain" icon @click="editLabel(label)" size="24">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </template>
                <v-card-text>{{ label.description }}</v-card-text> 
              </v-card>
              <v-card title="+ New label"  class="ma-1 d-flex align-center justify-center cursor-pointer"
                style="border: 1px dashed #9E9E9E; background-color: #F5F5F5;" @click="newLabel(project)">
              </v-card>
            </div>
            <v-divider class="mt-2"></v-divider>
            <v-card-actions style="width: 100%;">
              <v-spacer/>
              <v-btn @click="editProject(project)" prepend-icon="mdi-pencil">Edit project</v-btn>
              <v-btn variant="tonal" color="primary"  prepend-icon="mdi-list-box-outline" :to="`/project/${project._id}`">Manage tasks</v-btn>
            </v-card-actions>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-dialog v-model="dialog" persistent max-width="500">
      <v-card title="Project manager" subtitle="Create and edit projects">
        <div class="ml-4 mr-4">
          <v-form id="user-form" v-model="isValid" fast-fail>
            <v-row justify="start" no-gutters>
              <v-col cols="6">
                <v-text-field v-model="project.name" :rules="fieldRequired" label="Name" required
                  class="mr-1"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field class="ml-1" v-model="project.folder" :rules="fieldRequired" label="Folder" return-object
                  required></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="project.description" label="Description" required></v-textarea>
              </v-col>
              <v-col cols="12">
                <div class="text-center">
                  <v-btn-toggle v-model="project.revision_strategy" mandatory>
                    <v-btn value="auto">
                      <v-icon start>mdi-auto-upload</v-icon>
                      <span>Automatic</span>
                    </v-btn>
                    <v-btn value="manual">
                      <v-icon start>mdi-pencil</v-icon>
                      <span>Manual</span>
                    </v-btn>
                  </v-btn-toggle>
                </div>
              </v-col>
            </v-row>
          </v-form>
        </div>
        <v-card-actions>
          <v-btn @click="dialog = false">Cancel</v-btn>
          <v-btn :disabled="!isValid" @click="submit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="labelDialog" persistent max-width="500">
      <v-card title="Label management" subtitle="Create and edit label">
        <div class="ml-4 mr-4">
          <v-form id="label-form" v-model="isValid" fast-fail>
            <v-row justify="start" no-gutters>
              <v-col cols="6">
                <v-text-field v-model="label.name" :rules="fieldRequired" label="Name" required
                  class="mr-1"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="label.description" label="Description" required class="mr-1"></v-text-field>
              </v-col>
            </v-row>
          </v-form>
          <span>Color</span>
          <v-color-picker hide-inputs :swatches-max-height="100" show-swatches width="100%" title="Color"
            v-model="label.color"></v-color-picker>
        </div>
        <v-card-actions>
          <v-btn @click="labelDialog = false">Cancel</v-btn>
          <v-btn :disabled="!isValid" @click="submitLabel">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
const { $axios } = useNuxtApp();
import Swal from 'sweetalert2';

const store = useAuthStore();
const isLoading = ref(false);
const labelDialog = ref(false);
const label = ref({
  _id: null,
  project: null,
  name: '',
  color: null
});
const projects = ref([]);
const isValid = ref(false);
const dialog = ref(false);
const project = ref({
  _id: null,
  name: '',
  description: '',
  folder: '',
  labels: [],
  revision_strategy: 'auto'
});

const fieldRequired = [
  value => {
    if (value !== '') {
      return true;
    } else {
      return 'Field required';
    }
  }
];

function newProject() {
  project.value = {
    _id: null,
    name: '',
    description: '',
    folder: '',
    labels: []
  };
  dialog.value = true;
}

function loadProjects() {
  $axios.get('/project/list')
    .then((response) => {
      projects.value = response.data;
    })
    .catch(error => {
      Swal.fire({
        icon: 'error',
        title: 'Oops, something went wrong',
        text: 'Reload the page and try again. If the problem persist, contact administrator'
      });
    });
}

function newLabel(project) {
  labelDialog.value = true;
  label.value = {
    _id: null,
    project: project._id,
    name: '',
    color: null
  };
}
function editLabel(cLabel) {
  console.log(label);
  labelDialog.value = true;
  label.value = cLabel;
}

function editProject(p) {
  project.value = p;
  dialog.value = true;
}

function submit() {
  if (!isValid.value) {
    return;
  }
  if (project.value._id != null) {
    // update user profile information
    $axios.post('project/edit', project.value)
      .then((resp) => {
        loadProjects();
        dialog.value = false;
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: 'Oops, something went wrong',
          text: 'Try again later',
        });
      });
  } else {
    // create new user profile
    $axios.post('project/new', project.value)
      .then((resp) => {
        loadProjects();
        dialog.value = false;
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: 'Oops, something went wrong',
          text: 'Try again later',
        });
      });
  }
}

function submitLabel() {
  if (!isValid.value) {
    return;
  }
  if (label.value._id != null) {
    // update user profile information
    $axios.post('project/label/edit', label.value)
      .then((resp) => {
        loadProjects();
        labelDialog.value = false;
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: 'Oops, something went wrong',
          text: 'Try again later',
        });
      });
  } else {
    // create new user profile
    $axios.post('project/label/new', label.value)
      .then((resp) => {
        loadProjects();
        labelDialog.value = false;
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: 'Oops, something went wrong',
          text: 'Try again later',
        });
      });
  }
}

loadProjects();

definePageMeta({
  middleware: 'auth',
  name: 'user',
  layout: 'default'
});
</script>

<style scoped>
.swal2-container {
  z-index: 5000 !important;
}
</style>