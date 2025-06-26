<template>
  <v-container fluid>
    <div v-if="task._id != null" :id="`seadragon-viewer-${task._id}`" class="seadragon-viewer"
      @contextmenu.prevent="onContextMenu" />

    <v-card :class="['toolbox', 'navigation-toolbox', !zoomMenu ? 'small' : 'default']" @mouseenter="zoomMenu = true"
      @mouseleave="zoomMenu = false">
      <div class="text-center">
        <v-icon>mdi-magnify</v-icon>
        {{ zoom.toFixed(2) }}
      </div>
      <div v-if="zoomMenu">
        <v-slider hide-details thumb-label dense v-model="zoom" :max="40" min="0.5" step="0">
          <template v-slot:thumb-label="{ modelValue }">
            {{ modelValue.toFixed(2) }}
          </template>
        </v-slider>
        <v-slider hide-details thumb-label dense v-model="degree" :max="180" :min="-180" step="5">
        </v-slider>
        <div class="zoom-shortcuts">
          <v-btn variant="text" style="font-size: 12px" size="40" density="compact" @click="zoom = 1">1x</v-btn>
          <v-btn variant="text" style="font-size: 12px" size="40" density="compact" @click="zoom = 2">2x</v-btn>
          <v-btn variant="text" style="font-size: 12px" size="40" density="compact" @click="zoom = 10">10x</v-btn>
          <v-btn variant="text" style="font-size: 12px" size="40" density="compact" @click="zoom = 20">20x</v-btn>
          <v-btn variant="text" style="font-size: 12px" size="40" density="compact" @click="zoom = 40">40x</v-btn>
        </div>
      </div>
    </v-card>

    <v-card :class="['toolbox', 'annotation-toolbox', !annotationMenu ? 'small' : 'default']"
      @mouseenter="annotationMenu = true" @mouseleave="annotationMenu = false" v-if="task.project.labels.length > 0"
      :disabled="!annotationsEnabled">
      <v-menu top :close-on-click="true" offset-y>
        <template v-slot:activator="{ props }">
          <v-btn style="width: 100%;" variant="text" v-bind="props" :color="selectedLabel.color">
            <v-icon v-if="selectedTool != null" :color="selectedLabel.color" class="mr-2" size="26">
              {{ selectedTool.icon }}
            </v-icon>
            {{ selectedLabel.name }}
          </v-btn>
        </template>
        <v-list style="overflow: auto; max-height: 600px" @mouseleave="annotationMenu = false"
          @mouseenter="annotationMenu = true">
          <v-list-item v-for="(item, index) in task.project.labels" @click="selectedLabel = item" :key="index">
            <template v-slot:prepend>
              <v-avatar size="26" :color="item.color"></v-avatar>
            </template>
            <v-list-item-title>{{ item.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <div v-if="annotationMenu" class="text-center">
        <v-divider />
        <v-btn-toggle density="compact" v-model="selectedTool" class="ma-0" mandatory>
          <v-btn v-for="tool in tools" :value="tool" variant="text" icon>
            <v-icon>{{ tool.icon }}</v-icon>
          </v-btn>
        </v-btn-toggle>
      </div>
    </v-card>

    <v-card :class="['toolbox', 'annotation-list', mainPanelOpen ? 'extended' : '']" @mouseenter="mainPanelMenu = true"
      @mouseleave="mainPanelMenu = false">

      <div class="d-flex">
        <v-btn-toggle v-model="selectedAnnotationTab" class="align-center">
          <v-btn v-for="tab in mainPanelTabs" :key="tab" :icon="tab.icon" :value="tab" height="40" variant="text"
            width="40" />
          <v-btn v-if="mainPanelOpen" v-for="(tab, index) in colleaguesAnnotations" :key="tab"
            :value="{ type: 'annotation', annotator: tab.user.name, annotationList: tab.annotations, layer: (index + 1) }"
            icon="mdi-account-group" height="40" variant="text" width="40" />
          <v-btn v-if="mainPanelOpen" v-for="(tab, index) in modelsAnnotations" :key="tab"
            :value="{ type: 'annotation', annotator: tab.model.name, annotationList: tab.annotations, layer: (colleaguesAnnotations.length + index + 1) }"
            icon="mdi-train-car-centerbeam-full" height="40" variant="text" width="40" />
        </v-btn-toggle>
        <v-btn v-if="mainPanelOpen && task.project.revision_strategy === 'auto'" icon="mdi-update" height="40"
          variant="text" width="40" @click="loadRevisions"></v-btn>
        <v-list-item density="compact" v-if="hoveredAnnotationPreview != null">
          <template v-slot:prepend>
            <v-avatar size="24" :color="hoveredAnnotationPreview.label.color"></v-avatar>
          </template>
          <v-list-item-title>{{ hoveredAnnotationPreview.label.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ new
            Date(hoveredAnnotationPreview.created_at).toLocaleString() }}</v-list-item-subtitle>
        </v-list-item>
      </div>
      <div :id="`annotation-list-${task._id}`" v-if="mainPanelOpen" style="height: calc(100% - 48px)">
        <v-card v-if="selectedAnnotationTab != null"
          :title="selectedAnnotationTab.layer === 0 ? 'Annotation task' : `${selectedAnnotationTab.annotator}'s annotations`"
          class="ma-1" variant="tonal">
          <template v-slot:prepend>
            <v-btn :icon="drawStyle[selectedAnnotationTab.layer].drawing ? 'mdi-eye' : 'mdi-eye-off'" size="24"
              variant="flat" @click="switchLayerVisibility(selectedAnnotationTab.layer)">
            </v-btn>
          </template>
          <v-card-text>
            <v-slider v-model="drawStyle[selectedAnnotationTab.layer].fillOpacity" :max="1" :min="0" step="0.05"
              label="Fill Opacity" hide-details>
            </v-slider>
            <v-slider v-model="drawStyle[selectedAnnotationTab.layer].lineWidth" :max="10" :min="0" step="1"
              label="Line Width" hide-details>
            </v-slider>
            <v-slider v-model="drawStyle[selectedAnnotationTab.layer].hoverOpacity" :max="1" :min="0" step="0.05"
              label="Hover Opacity" hide-details>
            </v-slider>
            <v-divider />
            <v-switch v-if="selectedAnnotationTab.layer === 0" hide-details v-model="task.completed" color="primary"
              label="Task completed" />
          </v-card-text>
        </v-card>
        <v-virtual-scroll :items="annotationListTab" :height="annotationListHeight">
          <template v-slot:default="{ item }">
            <v-card variant="outlined" class="ma-1" @click="goToAnnotation(item)" :title="item.label.name">
              <template v-slot:append>
                <v-btn variant="text" @click.capture="editAnnotation(item)" icon="mdi-pencil" size="24"
                  :color="item.label.color" :disabled="!annotationsEnabled" v-if="selectedAnnotationTab.layer === 0" />
                <v-btn variant="text" @click.capture="removeAnnotation(item)" icon="mdi-delete" size="24"
                  :color="item.label.color" :disabled="!annotationsEnabled" v-if="selectedAnnotationTab.layer === 0" />

                <v-btn variant="text" @click.capture="flagAnnotation(item)"
                  :icon="item.flagged.includes(authStore.user._id) ? 'mdi-flag-variant-off' : 'mdi-flag'" size="24"
                  color="red" v-if="selectedAnnotationTab.layer !== 0 && item.user != null" />
              </template>
              <template v-slot:prepend>
                <v-avatar :color="item.label.color" size="22" class="mr-2" />
              </template>
            </v-card>
          </template>
        </v-virtual-scroll>
        <v-switch v-model="forceMainPanelOpen" label="Keep panel open"/>
      </div>
    </v-card>
    <context-menu>
      <v-btn-group>
        <v-btn @click="" icon="mdi-arrow-left"></v-btn>
        <v-btn v-if="!taskCompleted" @click="editAnnotation(hoveredAnnotationPreview)" prepend-icon="mdi-pencil">Edit</v-btn>
        <v-btn v-if="!taskCompleted" @click="removeAnnotation(hoveredAnnotationPreview)" prepend-icon="mdi-delete">Remove</v-btn>
      </v-btn-group>
    </context-menu>
  </v-container>
</template>
<script setup>
const { ContextMenu, openFromEvent,show } = useContextMenu();

import { AnnotationDrawer } from '@/SliceDrawer';
import OpenSeadragon from 'openseadragon';
import { nextTick } from 'vue';
import Swal from 'sweetalert2';
import { useAuthStore } from '~/stores/auth.js';

const { $axios } = useNuxtApp();
const onContextMenu = (ev) => {
  if (hoveredAnnotationPreview.value != null)
    openFromEvent(ev);
};
const props = defineProps({
  modelValue: {
    type: [Object],
    required: true
  }
});
const emit = defineEmits(['update:modelValue']);
const task = computed(() => {
  return props.modelValue;
}, { immediate: true });
watch(task, (newTask) => {
  emit('update:modelValue', newTask);
}, { deep: true });
const taskCompleted = computed(() => {
  return task.value.completed;
});
watch(taskCompleted, (newTaskCompleted) => {
  annotationDrawer.tool = 'pointer';
  $axios.post(`/session/${task.value._id}/completed`, { completed: newTaskCompleted })
    .catch(e => {
      Swal.fire({
        'icon': 'error',
        'title': 'Oops, something went wrong',
        'text': 'Your changes have not been saved. Try again later.',
      });
    });
});

let viewer = null;
let noEvents = false;
const annotationMenu = ref(false);

const forceMainPanelOpen = ref(false);
const mainPanelMenu = ref(false);
const mainPanelOpen = computed(()=> forceMainPanelOpen.value || mainPanelMenu.value)

const authStore = useAuthStore();

const annotationListTab = computed(() => {
  if (selectedAnnotationTab.value?.type === 'annotation') {
    return selectedAnnotationTab.value.annotationList;
  }
});
const degree = ref(0);
watch(degree, (val) => {
  viewer.viewport.setRotation(val);
});
const annotationsEnabled = computed(() => {
  /*
  Annotations are only enabled if:
   - The task belongs to the user
   - The task is not completed
   - The image degree is at 0
   */
  return task.value.user._id === authStore.user._id &&
    task.value.completed === false && degree.value === 0;
});
watch(annotationsEnabled, (isEnabled) => {
  if (isEnabled === false)
    selectedTool.value = {
      name: 'Cursor',
      icon: 'mdi-cursor-default'
    };
})
const zoomMenu = ref(false);
const zoom = ref(1);
watch(zoom, (val) => {
  if (viewer == null) return;
  viewer.viewport.zoomTo(val);
});

const colleaguesAnnotations = ref([]);
const modelsAnnotations = ref([]);

//region TOOLS
const tools = [
  {
    name: 'pointer',
    icon: 'mdi-cursor-default'
  },
  {
    name: 'polygon',
    icon: 'mdi-vector-polygon'
  },
  {
    name: 'rect',
    icon: 'mdi-vector-rectangle'
  },
  {
    name: 'circle',
    icon: 'mdi-circle-outline'
  },
  {
    name: 'ruler',
    icon: 'mdi-ruler'
  }
];
const mainPanelTabs = ref([
  {
    name: 'Annotations',
    icon: 'mdi-format-list-bulleted',
    type: 'annotation',
    layer: 0,
    annotationList: task.value.annotations
  },

]);
const selectedAnnotationTab = ref(mainPanelTabs.value[0]);
const selectedTool = ref({
  name: 'Cursor',
  icon: 'mdi-cursor-default'
});
const selectedLabel = ref({});
const showContextMenu = ref(false);
const hoveredAnnotationPreview = ref(null);

watch(hoveredAnnotationPreview, ()=>{
  show.value = false;
})
//endregion

let annotationDrawer = null;
watch(selectedTool, (newTool) => {
  if (newTool != null) {
    annotationDrawer.tool = newTool.name;
  }
});
watch(selectedLabel, (newLabel) => {
  if (annotationDrawer != null) {
    annotationDrawer.label = toRaw(selectedLabel.value);
  }
});
const annotationListHeight = ref(0);
watch(mainPanelMenu, (newMenu) => {
  if (newMenu === true) {
    nextTick(() => {
      annotationListHeight.value = document.getElementById(`annotation-list-${task.value._id}`).clientHeight - 268 ;//- 218;
    });
  }
});

const drawStyle = ref({});
watch(drawStyle, (newStyle) => {
  annotationDrawer.style = Object.values(newStyle);
  annotationDrawer.refresh();
}, { deep: true });

function switchLayerVisibility(layer) {
  drawStyle.value[layer].drawing = !drawStyle.value[layer].drawing;
  // full update required to apply this change
  annotationDrawer.update();
}

function goToAnnotation(annotation) {
  annotationDrawer.peep(annotation._id);
}

function editAnnotation(annotation) {
  annotationDrawer.editAnnotation(annotation._id);
}
function removeAnnotation(annotation) {
  Swal.fire({
    title: 'Are you sure you want to delete this annotation?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      console.log(toRaw(annotation))
      $axios.delete(`/session/${task.value._id}/annotation`, {
        data: {_id: annotation._id }
      }).then(res => {
        task.value.annotations = task.value.annotations.filter(a => a._id !== annotation._id);
        selectedAnnotationTab.value.annotationList = task.value.annotations
        annotationDrawer.loadAnnotations(toRaw(task.value.annotations));
      }).catch(err => {
        Swal.fire({
          'icon': 'error',
          'title': 'Oops, something went wrong',
          'text': 'Your changes have not been saved. Try again later.',
        });
      })
    }
  })
}


function flagAnnotation(annotation) {
  const isFlagging = !annotation.flagged.includes(authStore.user._id)
  $axios.post(`/session/${task.value._id}/flag`, {
    '_id': annotation._id,
    'flag': isFlagging
  })
    .then(res => {
      if (isFlagging) {
        annotation.flagged.push(authStore.user._id);
      } else {
        annotation.flagged = annotation.flagged.filter(item => item !== authStore.user._id)
      }
    })
    .catch(e => {
      console.log(e);
      Swal.fire({
        'icon': 'error',
        'title': 'Oops, something went wrong',
        'text': 'Your changes have not been saved. Try again later.',
      });
    });
}

function loadRevisions() {
  if (task.value.revision_strategy === 'auto') {
    listColleagues();
  }
  listModelAnnotations();
}

function listColleagues() {
  $axios.get(`/session/${task.value._id}/colleagues`)
    .then(response => {
      nextTick(() => {
        colleaguesAnnotations.value = response.data;
        colleaguesAnnotations.value.forEach((colleagueTask, index) => {
          annotationDrawer.loadAnnotations(colleagueTask.annotations, index + 1);
          drawStyle.value[index + 1] = {
            index: index + 1,
            drawing: true,
            fillOpacity: 0.2,
            lineWidth: 2,
            hoverOpacity: 0.5,
            showImporting: true,
            lineDash: [10, 3]
          };
        });

      });
    });
}

function listModelAnnotations() {
  $axios.get(`/session/${task.value._id}/models`)
    .then(response => {
      nextTick(() => {
        modelsAnnotations.value = response.data;
        modelsAnnotations.value.forEach((modelTask, index) => {
          annotationDrawer.loadAnnotations(modelTask.annotations, index + 1);
          drawStyle.value[index + 1] = {
            index: index + 1,
            drawing: true,
            fillOpacity: 0.2,
            lineWidth: 2,
            hoverOpacity: 0.5,
            showImporting: true,
            lineDash: [10, 3],
            machineAnnotation: true
          };
        });
      });
    });
}

onMounted(() => {
  nextTick(() => {
    viewer = OpenSeadragon({
      id: `seadragon-viewer-${task.value._id}`,
      tileSources: `${$axios.defaults.baseURL}session/${task.value._id}.dzi`,
      showNavigator: true,
      navigatorPosition: 'TOP_LEFT',
      navigatorRight: '16px',
      navigatorBottom: '16px',
      navigatorHeight: '120px',
      navigatorWidth: '145px',
      showNavigationControl: false,
      gestureSettingsMouse: {
        clickToZoom: false,
      },
    });
    viewer.addHandler('zoom', (e) => {
      noEvents = true;
      zoom.value = e.zoom;
    });

    // Instantiating annotation drawer
    annotationDrawer = new AnnotationDrawer(
      viewer,
      {
        onViewportChanged: (viewport) => {
        },
        onInfoUpdate: (info) => {
        },
        onStateRestorerEvent: (data) => {
        },
        onFinishNewDrawing: (annotation) => {
          if (annotation.geometry.points.length >= 2) {
            $axios.post(`/session/${task.value._id}/annotation`, {
              _id: null,
              label: annotation.label,
              geometry: annotation.geometry
            })
              .then((res) => {
                annotation._id = res.data._id;
                annotation.created_at = res.data.created_at;
                annotation.updateImageLocation();
                annotationDrawer.annotationSet[0].push(annotation);
                annotationDrawer.annotationMap[annotation._id] = annotation;
                task.value.annotations.push({
                  _id: annotation._id,
                  created_at: annotation.created_at,
                  geometry: annotation.geometry,
                  label: annotation.label,
                  layer: annotation.layer,
                  flagged: []
                });
                annotationDrawer.update();
              });
          }
        },
        onFinishedEditing: (changed, annotation) => {
          if (changed) {
            $axios.post(`/session/${task.value._id}/annotation`, {
              _id: annotation._id,
              label: annotation.label,
              geometry: annotation.geometry
            })
              .then((res) => {

              });
          }
        },
        onHover: (annotation) => {
          console.log(annotation)
          hoveredAnnotationPreview.value = annotation;
        },
        onLeave: (annotation) => {
          hoveredAnnotationPreview.value = null;
        },
        onClick: (annotation) => {
        },
      }
    );
    drawStyle.value[0] = {
      fillOpacity: 0.2,
      lineWidth: 2,
      hoverOpacity: 0.5,
      lineDash: [],
      drawing: true
    };

    nextTick(() => {
      annotationDrawer.tool = 'pointer';
      selectedLabel.value = task.value.project.labels[0];
      annotationDrawer.label = task.value.project.labels[0];
      annotationDrawer.loadAnnotations(toRaw(task.value.annotations));
    });
  });
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

.toolbox {
  position: absolute;
  border-radius: 8px;
  padding: 8px;
  bottom: 16px;
  margin: 0 auto;
}

.zoom-shortcuts {
  display: flex;
  justify-content: center;
}

.navigation-toolbox.small {
  width: 80px;
  left: calc(50% - 40px);
}

.navigation-toolbox.default {
  width: 200px;
  left: calc(50% - 100px);
  z-index: 3;
}

.annotation-toolbox {
  left: 16px;
}

.annotation-toolbox.small {
  width: 160px;
  padding: 10px;
}

.annotation-toolbox.default {
  width: 200px;
  z-index: 3;
}

.annotation-list {
  right: 16px
}

.annotation-list.extended {
  width: 300px;
  top: 16px;
  z-index: 3;
}
</style>