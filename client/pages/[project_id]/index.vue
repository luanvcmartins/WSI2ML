<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card :title="`Tasks to annotate`" subtitle="Select a slide to annotate or click the continue button">
          <template v-slot:prepend>
            <v-progress-circular rotate="180" size="60" width="15" :model-value="100-progress" color="primary text-center">
              {{ progress }}%
            </v-progress-circular>
          </template>
          <v-card-actions>
            <v-btn color="primary" variant="tonal" prepend-icon="mdi-arrow-right" @click="nextSlide()">
              Continue
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <div class="d-flex flex-wrap justify-center mt-4">
      <v-card theme="dark" class="ma-1"
        :style="`max-width: 400px; background-image: url('${$axios.defaults.baseURL}/task/thumbnail/${userTask._id}'); background-size: cover; background-position: center; `"
        v-for="userTask in tasks" :to="`/session/${userTask._id}`" :key="userTask._id">

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
<script setup>
const { $axios } = useNuxtApp();
import Swal from 'sweetalert2';

const router = useRouter()
const route = useRoute();
const projectId = computed(() => {
  return route.params.project_id;
});

const tasks = ref([]);
const progress = computed(() => {
  const completed = tasks.value.filter(task => task.completed).length;
  return (completed / tasks.value.length) * 100;
});

function nextSlide(){
  router.push(`/session/${tasks.value.filter(task => task.completed === false)[0]._id}`)
}

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


<style scoped></style>