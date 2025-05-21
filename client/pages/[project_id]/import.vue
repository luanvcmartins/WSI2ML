<template>
  <v-container>
    <div class="pa-5 text-center"
      style="border-style: dashed; border-color: grey; border-width: 0.5px; cursor: pointer; border-radius: 30px;"
      @click="$refs.fileInput.click()" @ondrop="fileDropped">
      <v-icon size="64" color="primary">mdi-file-upload</v-icon><br>
      <span class="mt-2">Click to select a file or drop it here.</span>
    </div>

    <v-form class="d-none">
      <input type="file" ref="fileInput" @change="upload" />
    </v-form>


    <div class="d-flex flex-wrap justify-center mt-4" v-if="datasets.length > 0">
      <v-card variant="outlined" class="ma-2" v-for="dataset in datasets" :title="dataset.title"
        :subtitle="dataset.created_at">
        <v-card-text>{{ dataset.description }}</v-card-text>
        <v-list style="width: 100%;">
          <v-list-item variant="tonal" v-for="model in dataset.model_feedback"
            :title="`${model.model.name} &bullet; ${model.created_at}`" :subtitle="`${model.model.type}`">
            <template v-slot:append>
              <v-btn variant="text" @click="removeModel(model._id)" icon="mdi-delete-forever" />
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </div>
    <div v-else class="ma-8 text-center">
      <v-icon color="grey" size="48" class="mb-2">mdi-inbox</v-icon>
      <div>No dataset version created yet.</div>
    </div>

    <v-dialog v-model="processing.dialog" persistent max-width="400px">
      <v-card title="Processing annotations" subtitle="Please wait while the annotations are being processed">
        <v-card-text class="text-center">

          <v-progress-circular :model-value="(processing.info.step / 5) * 100" color="primary" size="80" width="6"
            :indeterminate="processing.info.step === 1">
            {{ processing.info.step }} / 4
          </v-progress-circular><br>
          <span>{{ processing.info.msg }}</span>
          <div>
            <v-progress-linear v-if="processing.info.step == 1" :model-value="processing.info.progress" color="primary"
              height="20"></v-progress-linear>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script setup>
import Swal from 'sweetalert2';
const fileInput = ref(null);

import { SSE } from 'sse.js';
const { $axios } = useNuxtApp();
const processing = ref({
  dialog: false,
  info: {
    step: 1,
    msg: 'Test',
    progress: 20
  }
});
const datasets = ref([]);

const route = useRoute();
const projectId = computed(() => {
  return route.params.project_id;
});

function fileDropped(event) {
  // event.preventDefault();
  // if (event.dataTransfer.items.length > 0) {
  //   fileInput.value.file.files = [event.dataTransfer.items[0].getAsFile()];
  //   upload();
  // }
}

function removeModel(model_id) {
  console.log(model_id)
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      $axios.post(`import/${model_id}/delete`).then(() => {
        Swal.fire({
          title: 'Deleted!',
          text: 'This model results have been deleted.',
          icon: 'success'
        });
        loadDatasetVersions();
      }).catch((error) => {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Oops, something went wrong',
          text: 'Failed to remove the model, please try again.'
        });
      });
    }
  });
}

function upload() {
  processing.value.dialog = true;
  processing.value.info.msg = 'Uploading file.';

  const form = new FormData();
  const reader = new FileReader();
  reader.readAsArrayBuffer(fileInput.value.files[0]);
  reader.addEventListener("load", ev => {
    console.log(ev)
    const eventSource = SSE($axios.defaults.baseURL + 'import/' + projectId.value + '/upload', {
      method: 'POST',
      headers: {
        ...$axios.defaults.headers.common,
        'Content-Type': undefined//`multipart/form-data; boundary=${form._boundary}`
      },
      payload: ev.target.result
    });
    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      console.log('event:', data);
      processing.value.info = data;

      if (data.step == 4) {
        Swal.fire({
          icon: 'success',
          title: 'Upload successful!'
        });
        loadDatasetVersions();
        processing.value.dialog = false;
        eventSource.close();
      }
    });

    eventSource.addEventListener('error', (event) => {
      console.error('Error:', event);
      processing.value.dialog = false;
      Swal.fire({
        icon: 'error',
        title: 'Upload failed!'
      });
    });
  })
  form.append('file', fileInput.value.files[0]);
  const dt = new DataTransfer();

  fileInput.value.files = dt.files;

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
definePageMeta({
  name: 'Import',
  layout: 'default',
  middleware: ['auth']
});
</script>


<style scoped></style>