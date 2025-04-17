<template>
  <div>
    <v-app-bar color="primary" density="compact">
      <v-btn icon @click="$router.go(-1)">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-app-bar-title>WSI <strong color="darkorange">//</strong> ML</v-app-bar-title>
      <v-select v-model="selectedTasks" :items="userTasks" label="Select a task" multiple outlined dense hide-details>
        <template v-slot:selection="{ item, index }">
          <v-chip :text="item.value.file"></v-chip>
        </template>
        <template v-slot:item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" :title="item.raw.title" :subtitle="item.raw.file"></v-list-item>
        </template>
      </v-select>
      <v-spacer></v-spacer>

    </v-app-bar>

    <v-container>
      <Teleport v-for="task in openedTasks" :key="task._id" :to="`#div-${task._id}`">
        <SlideManager :task="task"></SlideManager>
      </Teleport>
      <div id="gl-container" class="seadragon-viewer" style="height: calc(100%-48px);  margin-top: 48px;"></div>

    </v-container>
  </div>
</template>
<script setup>
import 'golden-layout/dist/css/goldenlayout-base.css';
import 'golden-layout/dist/css/themes/goldenlayout-light-theme.css';

import { nextTick, onMounted } from 'vue';
import { ComponentItem, GoldenLayout } from 'golden-layout';
import SlideManager from '~/components/SlideManager.vue';
import Swal from 'sweetalert2';


const { $axios } = useNuxtApp();

const defaultTask = ref()
const taskToTab = {};
const selectedTasks = ref([]);
const userTasks = ref([]);
const openedTasks = ref([]);
let layout = null;

import { useRoute } from "nuxt/app";
const route = useRoute()
const sessionId = computed(() => route.params.session_id);

watch(() => {
  selectedTasks.value.forEach(task => {
    if (!(task._id in taskToTab) && task._id != sessionId.value) {
      loadTask(task._id);
      taskToTab[task._id] = task
    }
  })
})

onMounted(() => {
  nextTick(() => {
    layout = new GoldenLayout(document.getElementById('gl-container'));

    layout.registerComponentFactoryFunction('example', (container, state) => {
      console.log('Sending state:', state);
      const mountEl = document.createElement('div');
      mountEl.id = `div-${state._id}`;
      container.element.appendChild(mountEl);

      openedTasks.value.push(state);
    });
    layout.resizeWithContainerAutomatically = true;
    layout.loadLayout({
      root: {
        type: 'column',
        content: [
          {
            type: 'stack',
            content: []
          }
        ]
      }
    });

    const sessionId = route.params.session_id;
    loadTask(sessionId);
  });
});

function findFirstStack(item) {
  if (item.type === 'stack') return item;
  if (!item.contentItems) return null;
  for (const child of item.contentItems) {
    const result = findFirstStack(child);
    if (result) return result;
  }
  return null;
}

function loadTasks() {
  $axios.get(`/session/slide_list`)
    .then((res) => {
      userTasks.value = res.data
    })
    .catch((err) => {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Something went wrong',
      })
    })
}

function loadTask(taskId) {
  $axios.get(`/session/${taskId}`)
    .then(resp => {
      const rootStack = findFirstStack(layout.root);
      console.log(rootStack);
      const task = resp.data;
      rootStack.addItem(
        {
          type: 'component',
          componentState: resp.data,
          componentType: 'example',
          title: task.file,
        });

      if (sessionId === resp.data._id) {
        selectedTasks.value.push(resp.data);
      }
    });

}

loadTasks();

definePageMeta({
  layout: 'empty',
  middleware: ['auth'],
});
</script>
<style scoped>
.seadragon-viewer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}
</style>