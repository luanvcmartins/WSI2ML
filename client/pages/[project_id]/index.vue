<template>
  <v-container>
    <div class="d-flex flex-wrap justify-center mt-4">
      <v-card
          theme="dark"
          class="ma-1"
          :style="`max-width: 400px; background-image: url('${$axios.defaults.baseURL}/task/thumbnail/${userTask._id}'); background-size: cover; background-position: center; ` "
          v-for="userTask in tasks"
          :to="`session/${userTask._id}`"
          :key="userTask._id"
      >

        <div style="backdrop-filter: brightness(0.7); height: 100%">
          <v-card-title>{{ userTask.title }}</v-card-title>
          <v-card-text class="bg-overlay text-white" style="width: 320px; height: 256px;">
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

      <v-card variant="flat" v-if="!tasks.length" class="ma-1 text-center">
        <v-card-text>
          <v-icon color="grey" large class="mb-2">mdi-inbox</v-icon>
          <div>No tasks to complete! Yet...</div>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>
<script setup lang="ts">
const {$axios} = useNuxtApp();
import Swal from 'sweetalert2';


const route = useRoute();
const projectId = computed(() => {
  return route.params.project_id;
});

const tasks = ref([]);

function loadTasks() {
  $axios.get(`/task/${projectId.value}/list`)
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
  name: 'task-list',
  layout: 'default'
});
</script>


<style scoped>

</style>