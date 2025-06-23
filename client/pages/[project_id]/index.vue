<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card :title="`Tasks to annotate`" subtitle="Select a slide to annotate or click the continue button">
          <v-card-actions>
            <v-btn color="primary" variant="tonal" prepend-icon="mdi-arrow-right" @click="nextSlide()">
              Continue
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <div>
          <v-card title="Tasks" subtitle="My tasks">

            <template v-slot:append>
              <v-text-field style="width: 500px;" cover v-model="taskTableConfig.search" append-inner-icon="mdi-magnify"
                @keydown.enter.prevent="search" @click:append-inner="search" variant="outlined" density="compact" label="Type and press enter to search"/>
            </template>
            <v-data-table-server v-model:items-per-page="taskTableConfig.itemsPerPage" :items="tasks"
              :headers="taskTableConfig.headers" :items-length="taskTableConfig.totalItems" @update:options="loadTasks">
              <template v-slot:item.thumbnail="{ item }">
                <v-img :src="$axios.defaults.baseURL + '/task/thumbnail/' + item._id" alt="Thumbnail"
                  width="150" height="100" cover  class="mr-2" />
              </template>
              <template v-slot:item.completed="{ item }">
                {{ item.completed ? '✅ Completed' : '⏳ Pending' }}
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn color="primary" variant="tonal" prepend-icon="mdi-arrow-right"
                  @click="$router.push(`/session/${item._id}`)">
                  Open
                </v-btn>
              </template>
              <template v-slot:no-data>
                <div class="ma-1 text-center">
                  <v-icon color="grey" large class="mb-2">mdi-inbox</v-icon>
                  <div>No tasks to complete! Yet...</div>
                </div>
              </template>
            </v-data-table-server>
          </v-card>
        </div>
      </v-col></v-row>
  </v-container>
</template>
<script setup>
const { $axios } = useNuxtApp();
import { ref, watch } from 'vue'
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

function nextSlide() {
  router.push(`/session/${tasks.value.filter(task => task.completed === false)[0]._id}`)
}

function loadTasks(config) {
  // config.search = taskTableConfig.value.search
  console.log("loadTasks", config)
  $axios.get(`/task/${projectId.value}/list`, { params: { ...config, search: taskTableConfig.value.search } })
    .then((res) => {
      tasks.value = res.data.data;
      taskTableConfig.value.totalItems = res.data.metadata.length > 0 ? res.data.metadata[0].total : 0;
    })
    .catch((err) => {
      Swal.fire({
        icon: 'error',
        title: 'Something went wrong',
      });
    });
}

// loadTasks();

const taskTableConfig = ref({
  headers: [
    {
      title: '',
      align: 'start',
      sortable: false,
      key: 'thumbnail',
    },
    { title: 'Slide file', key: 'title', align: 'start' },
    { title: 'Completed?', key: 'completed', align: 'end' },
    { title: 'Continue', key: 'actions', align: 'end', sortable: false },
  ],
  totalItems: 0,
  search: '',
  itemsPerPage: 10
})


function search() {
  loadTasks({
    page: 1,
    itemsPerPage: taskTableConfig.value.itemsPerPage,
    search: taskTableConfig.value.search
  });
}


definePageMeta({
  middleware: 'auth',
  name: 'task-list',
  layout: 'default'
});
</script>


<style scoped></style>