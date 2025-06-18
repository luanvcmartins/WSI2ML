<template>
  <v-container>
    <v-card elevation="0" v-for="task in tasks" :key="task._id" :title="task.project.name"
      :subtitle="task.project.description" :to="`/${task.project._id}`" append-icon="mdi-chevron-right">
      <!-- <template v-slot:prepend>
        <v-progress-circular
            rotate="180"
            size="60"
            width="15"
            color="pink"
            :model-value="(task.completed_count / task.tasks.length)*100"
        >
          {{ task.tasks.length - task.completed_count }}
        </v-progress-circular>
      </template> -->

      <v-card-text>
        <div class="d-flex flex-wrap justify-center mt-4">
          <v-card theme="dark" class="ma-1"
            :style="`max-width: 250px; background-image: url('${$axios.defaults.baseURL}/task/thumbnail/${userTask._id}'); background-size: cover; background-position: center; `"
            v-for="userTask in task.tasks" :to="`session/${userTask._id}`" :key="userTask._id">

            <div style="backdrop-filter: brightness(0.7); height: 100%">
              <v-card-title>{{ userTask.title }}</v-card-title>
              <v-card-text class="bg-overlay text-white" style="width: 320px; height: 100px;">
                <div class="d-flex justify-center align-center mt-auto"
                  style="position: absolute; bottom: 16px; width: 100%;">
                  <span v-if="userTask.completed" class="text-success d-flex align-center">
                    <v-icon class="mr-2">mdi-check-circle</v-icon>Completed
                  </span>
                  <span v-else class="text-warning d-flex align-center">
                    <v-icon class="mr-2">mdi-alert-circle</v-icon><strong>Not completed</strong>
                  </span>
                </div>
              </v-card-text>
            </div>
          </v-card>

          <v-card variant="flat" v-if="!task.tasks.length" class="ma-1 text-center">
            <v-card-text>
              <v-icon color="grey" large class="mb-2">mdi-inbox</v-icon>
              <div>No tasks to complete! Yet...</div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
      <v-divider />
      <v-card-actions class="justify-center">
        <v-icon>mdi-chevron-right</v-icon><span class="text-caption">Click to handle this project</span>
      </v-card-actions>
    </v-card>

    <v-card variant="flat" v-if="tasks.length === 0" class="ma-1 text-center">
      <v-card-text>
        <v-icon color="grey" large class="mb-2">mdi-inbox</v-icon>
        <div>No tasks to complete! Yet...</div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
<script setup>
const { $axios } = useNuxtApp();
import Swal from 'sweetalert2';

const tasks = ref([]);

function loadTasks() {
  $axios.get('/task/list')
    .then((res) => {
      tasks.value = res.data;
    })
    .catch((err) => {
      Swal.fire({
        icon: 'error',
        title: 'Something went wrong',
      });
    });
}

loadTasks();

definePageMeta({
  middleware: 'auth',
  name: 'welcome',
  layout: 'default'
});
</script>

<style scoped></style>