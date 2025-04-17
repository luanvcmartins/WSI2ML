<template>
  <v-container>
    <v-card elevation="0" v-for="task in tasks" :key="task._id" :title="task.name" :subtitle="task.description">
      <v-card-text>
        <div class="d-flex flex-wrap justify-start mt-4">
          <v-card class="ma-1" style="max-width: 400px;" v-for="userTask in task.tasks" :to="`session/${userTask._id}`" :title="userTask.file" >
            <v-card-text>{{ userTask }}</v-card-text>
          </v-card>
        </div>
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
  name: "welcome",
  layout: "default"
});
</script>

<style scoped></style>