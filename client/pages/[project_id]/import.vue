<template>
  <v-container>


    <v-card
        class="ma-2 d-flex justify-center align-center"
        outlined
        style="width: 400px; height: 400px; cursor: pointer;"
        @click="$refs.hiddenFileInput.click()"
    >
      <v-icon size="64" color="primary">mdi-file-upload</v-icon>
      <span class="mt-2">Click to select a file</span>
    </v-card>

    <v-form class="d-none">
      <input type="file" ref="hiddenFileInput" @change="handleFileChange"/>
    </v-form>
    <div class="d-flex flex-wrap justify-center mt-4">
      <v-card class="ma-2" v-for="version in datasets" :title="version.title" :subtitle="version.created_at">
        <v-card-text>{{ version.description }}</v-card-text>
        <v-card-actions>
          <v-spacer/>

          <v-btn v-if="version.status === 'ready'" prepend-icon="mdi-upload" @click="upload(version._id)">
            Upload
          </v-btn>
          <span v-else><v-icon color="warning" class="mr-2" small>mdi-alert</v-icon> Not available</span>
          <v-spacer/>
        </v-card-actions>

      </v-card>
    </div>
  </v-container>
</template>
<script setup>
import Swal from 'sweetalert2';

import { SSE } from 'sse.js';
const { $axios } = useNuxtApp();

const datasets = ref([]);

const route = useRoute();
const projectId = computed(() => {
  return route.params.project_id;
});

function upload() {
  const form = new FormData();
  form.append('file', )

}

function loadDatasetVersions() {
  $axios.get(`/import/${projectId.value}/list`)
      .then((res) => {
        datasets.value = res.data;
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: 'Something went wrong'
        });
      });
}

loadDatasetVersions();
</script>


<style scoped>

</style>