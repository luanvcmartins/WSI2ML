<template>
  <v-container>
    <v-card variant="text" title="Project Export" subtitle="">
      <template v-slot:append>
        <v-btn variant="outlined" color="primary" prepend-icon="mdi-plus" @click="loadVersionCreation(exports._id)"
          rounded size="large">
          Create new dataset version
        </v-btn>
      </template>
      <v-card-text>
        <div class="d-flex flex-wrap justify-center mt-4">
          <v-card variant="outlined" class="ma-2" v-for="version in exports" :title="version.title"
            :subtitle="version.created_at">
            <v-card-text>{{ version.description }}</v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn v-if="version.status === 'ready'" prepend-icon="mdi-download" @click="download(version._id)">
                Download
              </v-btn>
              <span v-else><v-icon color="warning" class="mr-2" small>mdi-alert</v-icon> Not available</span>
              <v-spacer />
            </v-card-actions>
          </v-card>
        </div>
      </v-card-text>
    </v-card>


    <v-dialog v-if="newProjectExport != null" v-model="newDatasetVersionDialog" persistent max-width="600px">
      <v-card>
        <v-card-title>
          Create new dataset version
        </v-card-title>
        <v-card-text>
          <v-form fast-fail v-model="isFormValid">
            <v-row no-gutters>
              <v-col cols="12">
                <v-text-field label="Title" v-model="newDatasetRequest.title" :rules="fieldRequired" outlined
                  required></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-textarea label="Description" v-model="newDatasetRequest.description" :rules="fieldRequired" outlined
                  required></v-textarea>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <v-select label="Include all annotations from" :items="newProjectExport.users"
                  v-model="newDatasetRequest.users" multiple item-value="_id" item-title="name" outlined color="green"
                  variant="outlined" hint="All annotations from the selected users will be exported"
                  persistent-hint></v-select>
              </v-col>
              <v-col cols="6">
                <v-select label="Not include annotations flagged by" :items="newProjectExport.users" multiple
                  v-model="newDatasetRequest.not_flagged_by" outlined item-value="_id" item-title="name" color="red"
                  variant="outlined" hint="Annotation flagged by the selected users will not be exported"
                  persistent-hint></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn text color="red" @click="newDatasetVersionDialog = false">Cancel</v-btn>
          <v-btn text color="green" @click="createDatasetVersion(newDatasetRequest.project)" :disabled="!isFormValid">
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog v-model="constructionProgress.dialog" persistent max-width="600px">
      <v-card title="Creating dataset version" subtitle="Please wait while the dataset version is being created">
        <v-card-text class="text-center">
          <v-progress-circular :model-value="(constructionProgress.info.step / 5) * 100" color="primary" size="80"
            width="6" :indeterminate="constructionProgress.info.step === 3">
            {{ constructionProgress.info.step }} / 5
          </v-progress-circular>
          <p class="mt-3">{{ constructionProgress.info.msg }}</p>
          <v-progress-linear :model-value="constructionProgress.info.progress * 100"
            v-if="constructionProgress.info.step === 3" height="10" color="primary" />

          <v-card variant="outlined" class="mt-3" v-if="constructionProgress.info.step >= 3"
            :title="constructionProgress.info.total_annotations + ' annotations'">
            <v-card-text>
              <span v-for="[label, count] in Object.entries(constructionProgress.info.annotation_count)" :key="label">
                {{ label }}
                <v-progress-linear :model-value="(count / constructionProgress.info.total_annotations) * 100" />
              </span>
            </v-card-text>
          </v-card>

        </v-card-text>
        <v-card-actions>
          <v-btn v-if="constructionProgress.info.step === 5" @click="constructionProgress.dialog = false">Close</v-btn>
          <v-btn v-if="constructionProgress.info.step === 5"
            @click="download(newDatasetRequest._id); constructionProgress.dialog = false"
            prepend-icon="mdi-download">Download
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import Swal from 'sweetalert2';
import { SSE } from 'sse.js';

const { $axios } = useNuxtApp();
const exports = ref({});
const newProjectExport = ref();


const route = useRoute();
const projectId = computed(() => {
  return route.params.project_id;
});

const isFormValid = ref(false);
const newDatasetVersionDialog = ref(false);
const newDatasetRequest = ref({
  project: '',
  title: '',
  description: '',
  users: [],
  only_slides: [],
  not_flagged_by: [],
  _id: null
});
const constructionProgress = ref({
  dialog: false,
  info: {
    step: 3,
    progress: .5,
    msg: 'Text',
    total_annotations: 12,
    annotation_count: {
      Fibrose: 2,
      'Tecido adiposo': 10
    }
  }
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

function download(projectId) {
  // navigate to download page on new tab
  window.open($axios.defaults.baseURL + 'export/download/' + projectId, '_blank');
}

function createDatasetVersion() {
  const eventSource = SSE($axios.defaults.baseURL + 'export/' + projectId.value + '/new',
    {
      headers: {
        ...$axios.defaults.headers.common,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(newDatasetRequest.value),
      method: 'POST'
    });

  eventSource.addEventListener('message', (event) => {
    console.log('Evento recebido:', event.data);
    const data = JSON.parse(event.data);
    constructionProgress.value.info = data;
    if (data.step === 0) {
      newDatasetVersionDialog.value = false;
      constructionProgress.value.dialog = true;
    } else if (data.step === 5) {
      newDatasetRequest.value._id = data._id
      eventSource.close();
      loadExports();
    }
  });

  eventSource.addEventListener('error', (event) => {
    Swal.fire({
      icon: 'error',
      title: 'Error creating dataset version',
      message: 'Something went wrong while creating the dataset version. Please try again later.'
    });
    eventSource.close();
  });
}

function loadVersionCreation() {
  $axios.get(`/export/${projectId.value}/prepare_version`)
    .then((res) => {
      newDatasetRequest.value['project'] = projectId;
      newProjectExport.value = res.data[0];
      nextTick(() => {
        newDatasetVersionDialog.value = true;
      });
    })
    .catch((err) => {
      Swal.fire({
        icon: 'error',
        title: 'Something went wrong',
      });
    });
}

function loadExports() {
  $axios.get(`/export/${projectId.value}/list`)
    .then((res) => {
      exports.value = res.data;
    })
    .catch((err) => {
      Swal.fire({
        icon: 'error',
        title: 'Something went wrong',
      });
    });
}

loadExports();

definePageMeta({
  name: 'export',
  middleware: 'auth'
});
</script>


<style scoped></style>