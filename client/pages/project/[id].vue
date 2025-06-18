<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>

        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card
            title="Task management"
            subtitle="Manage tasks to users.">
          <v-card-text>
            <v-row no-gutters>
              <v-col sm="4" lg="6">
                <v-card
                    class="mr-1 ml-1"
                    variant="outlined"
                    title="Create tasks"
                    subtitle="Select users and files."
                    @click="dialog = true"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col>
        <v-card title="Tasks" :loading="isLoading">
          <v-card-text>

            <v-data-table
                :headers="table"
                density="compact" :items="tasks.tasks">

              <template v-slot:item.tasks="{ item }">
                <v-chip-group>
                  <v-chip v-for="task in item.tasks" :to="`/session/${task._id}`"
                          :prepend-icon="task.completed ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-circle-outline'">{{ task.user.name }}</v-chip>
                </v-chip-group>
              </template>


              <template v-slot:item.actions="{ item }">
                <v-btn :icon="item.enabled ? `mdi-delete` : 'mdi-progress-check'" size="32" variant="text" @click="switchItemStatus(item)"/> 
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog max-width="600" v-model="dialog" persistent>
      <v-card title="New task">
        <v-card-text>
          <v-form>
            <v-chip-group
                filter v-model="createTaskRequest.users"
                column
                return-object
                multiple>
              <v-chip v-for="user in tasks.users" :value="user">{{ user.name }}</v-chip>
            </v-chip-group>

            <v-treeview
                style="max-height: 300px; overflow-y: auto"
                :items="tasks.files"
                selectable
                select-strategy="leaf"
                multiple
                item-value="id"
                return-object
                v-model="createTaskRequest.files"
                selection-type="leaf"
            >

              <template v-slot:prepend="{ item }">
                <v-icon icon="mdi-file"></v-icon>
              </template>
            </v-treeview>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="dialog = false">Cancel</v-btn>
          <v-btn @click="submit" :disabled="isLoading" :loading="isLoading">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script setup>

import {useRoute} from "nuxt/app";
import Swal from "sweetalert2";
const isLoading = ref(true);  
const route = useRoute();
const projectId = computed(() => {
  return route.params.id
});
const dialog = ref(false);
const {$axios} = useNuxtApp();
const tasks = ref({});
const createTaskRequest = ref({
  projectId: projectId,
  files: [],
  users: []
});
const table = [
  {title: 'File', value: '_id'},
  {title: 'Tasks', value: 'tasks'},
  {title: 'Actions', key: 'actions', sortable: false},
];

function loadTasks() {
  isLoading.value = true;
  $axios.get(`/project/${projectId.value}/tasks`)
      .then((res) => {
        isLoading.value = false;
        tasks.value = res.data;
      })
      .catch((err) => {
        isLoading.value = false;
        Swal.fire({
          icon: 'error',
          title: 'Something went wrong',
        });
      });
}

function submit() {
  isLoading.value = true;
  $axios.post(`/project/${projectId.value}/task/create`, createTaskRequest.value)
      .then((res) => {
        isLoading.value = false;
        Swal.fire({
          icon: 'success',
          title: 'Tasks created',
        });
        dialog.value = false;
        loadTasks();
      })
      .catch((err) => {
        isLoading.value = false;
        Swal.fire({
          icon: 'error',
          title: 'Something went wrong',
        });
      });
}

function switchItemStatus(item){
  console.log(item)
  Swal.fire({
    icon: 'warning',
    title: 'Are you sure?',
    text: 'This will remove the task.',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      isLoading.value = true;
      $axios.post(`/project/${projectId.value}/task/switch_status`, {slide_hash: item.slide_hash})
          .then(() => {
            isLoading.value = false;
            Swal.fire({
              icon: 'success',
              title: 'Task disabled',
            });
            loadTasks();
          })
          .catch((err) => {
            isLoading.value = false;
            Swal.fire({
              icon: 'error',
              title: 'Something went wrong',
            });
          });
    }
  });
}

function autoAssign() {
  Swal.fire({
    icon: "question",
    showConfirmButton: true,
    title: "Are you sure you want to proceed?",
    text: "Every new slide will be assigned to every user for annotation."
  }).then((result) => {
    if (result) {
      $axios.post("/tasks/create/auto_assign", {"id": projectId.value}).then((res) => {

      });
    }
  })
}

function delegateTasks() {
  Swal.fire({
    icon: "question",
    showConfirmButton: true,
    title: "Are you sure you want to proceed?",
    text: "Every new slide will be assigned to every user for annotation."
  }).then((result) => {
    if (result) {
      $axios.post("/tasks/create/auto_assign", {"id": projectId.value}).then((res) => {

      })
    }
  })
}

loadTasks()

definePageMeta({
  layout: 'default',
  middleware: ['auth'],
});
</script>
<style scoped>
.swal2-container {
  z-index: 9999 !important;
}
</style>