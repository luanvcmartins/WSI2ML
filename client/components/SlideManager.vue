<template>
  <v-container fluid>
    <div v-if="props.task._id != null" :id="`seadragon-viewer-${props.task._id}`" class="seadragon-viewer" />

    <v-card :class="['toolbox', 'navigation-toolbox', !zoomMenu ? 'small' : 'default']" @mouseenter="zoomMenu = true"
      @mouseleave="zoomMenu = false">
      <div class="text-center"><v-icon>mdi-magnify</v-icon> {{ zoom.toFixed(2) }}</div>
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
      @mouseenter="annotationMenu = true" @mouseleave="annotationMenu = false">
      <v-menu top :close-on-click="true" offset-y>
        <template v-slot:activator="{ props }">
          <v-btn style="width: 100%" variant="text" v-bind="props">
            <v-icon v-if="selectedTool != null" :color="selectedLabel.color" class="mr-2" size="26">{{ selectedTool.icon
            }}</v-icon>
            {{ selectedLabel.name }}
          </v-btn>
        </template>
        <v-list style="overflow: auto; max-height: 600px">
          <v-list-item v-for="(item, index) in props.task.project.labels" @click="selectedLabel = item" :key="index">
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

    <v-card :class="['toolbox', 'annotation-list', mainPanelMenu ? 'extended' : '']" @mouseenter="mainPanelMenu = true"
      @mouseleave="mainPanelMenu = false">

      <div class="d-flex">
        <v-btn-toggle v-model="selectedAnnotationTab">
          <v-btn v-for="tab in mainPanelTabs" :key="tab" :value="tab" :icon="tab.icon" height="40" variant="text"
            width="40"></v-btn>
          <v-btn v-if="mainPanelMenu" v-for="tab in colleaguesAnnotations" :key="tab" :value="tab" icon="mdi-account-group" height="40" variant="text"
            width="40"></v-btn>

        </v-btn-toggle>
        <v-btn v-if="mainPanelMenu && props.task.project.revision_strategy === 'auto'" icon="mdi-update" height="40"
          variant="text" width="40" @click="listColleagues"></v-btn>
      </div>
      <div :id="`annotation-list-${props.task._id}`" v-if="mainPanelMenu" style="height: calc(100% - 48px)">
        <v-virtual-scroll :items="props.task.annotations" :height="annotationListHeight">
          <template v-slot:default="{ item }">
            <v-card variant="outlined" class="ma-1" @click="goToAnnotation(item)" append-icon="mdi-pencil"
              @append-icon.click="editAnnotation(item)" :title="item.label.name">
              <template v-slot:append>
                <v-btn @click.capture="editAnnotation(item)" icon size="24"><v-icon
                    :color="item.label.color">mdi-pencil</v-icon></v-btn>
              </template>
              <template v-slot:prepend>
                <v-avatar :color="item.label.color" size="22" class="mr-2" />
              </template>
            </v-card>
          </template>

        </v-virtual-scroll>
      </div>

    </v-card>
  </v-container>
</template>
<script setup>
import { AnnotationDrawer } from '@/SliceDrawer';
import OpenSeadragon from 'openseadragon';
import { nextTick } from 'vue';

const { $axios } = useNuxtApp();

const props = defineProps({
  task: Object
});
let viewer = null;
let noEvents = false;
const mainPanelMenu = ref(false);
const annotationMenu = ref(false);

const degree = ref(0);
watch(degree, (val) => {
  viewer.viewport.setRotation(val);
});
const zoomMenu = ref(false);
const zoom = ref(1);
watch(zoom, (val) => {
  if (viewer == null) return;
  viewer.viewport.zoomTo(val);
});

const colleaguesAnnotations = ref([]);


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
    name: 'Configuration',
    icon: 'mdi-cog',
  },
  {
    name: 'Annotations',
    icon: 'mdi-format-list-bulleted'
  },

])
const selectedAnnotationTab = ref();
const selectedTool = ref({
  name: 'Cursor',
  icon: 'mdi-cursor-default'
});
const selectedLabel = ref({});
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
  if (newMenu == true) {
    nextTick(() => {
      annotationListHeight.value = document.getElementById(`annotation-list-${props.task._id}`).clientHeight;
    });
  }
})

const drawStyle = ref([{
  fillOpacity: 0.2,
  lineWidth: 2,
  hoverOpacity: 0.5,
  showImporting: true,
}, {
  fillOpacity: 0.2,
  lineWidth: 2,
}])

function goToAnnotation(annotation) {
  annotationDrawer.peep(annotation._id);
}
function editAnnotation(annotation) {
  annotationDrawer.editAnnotation(annotation._id);
}

function listColleagues() {
  $axios.get(`/session/${props.task._id}/colleagues`).then(response => {
    console.log(response.data);
    colleaguesAnnotations.value = response.data;
  });
}

onMounted(() => {
  nextTick(() => {
    console.log(props.task);
    viewer = OpenSeadragon({
      id: `seadragon-viewer-${props.task._id}`,
      tileSources: `${$axios.defaults.baseURL}/session/${props.task._id}.dzi`,
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
        onViewportChanged: (viewport) => { },
        onInfoUpdate: (info) => { },
        onStateRestorerEvent: (data) => { },
        onFinishNewDrawing: (annotation) => {
          console.log({
            _id: null,
            label: annotation.label,
            geometry: annotation.geometry
          });
          $axios.post(`/session/${props.task._id}/annotation`, {
            _id: null,
            label: annotation.label,
            geometry: annotation.geometry
          }).then((res) => {
            annotation._id = res.data._id
            annotationDrawer.annotationSet[0].push(annotation);
          })
        },
        onFinishedEditing: (changed, annotation) => {
          if (changed) {
            $axios.post(`/session/${props.task._id}/annotation`, {
              _id: annotation._id,
              label: annotation.label,
              geometry: annotation.geometry
            }).then((res) => {

            })
          }
        },
        onHover: (annotation) => { },
        onLeave: (annotation) => { },
        onClick: (annotation) => { },
      }
    );
    annotationDrawer.style = toRaw(drawStyle.value);
    annotationDrawer.tool = 'pointer';
    selectedLabel.value = props.task.project.labels[0];
    annotationDrawer.label = props.task.project.labels[0];
    annotationDrawer.loadAnnotations(toRaw(props.task.annotations));

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