<template>
  <v-container fluid>
    <div
        v-if="props.task._id != null"
        :id="`seadragon-viewer-${props.task._id}`"
        class="seadragon-viewer"/>

    <div :class="['toolbox', 'navigation-toolbox', !zoomMenu ? 'small' : 'default']"
         @mouseenter="zoomMenu = true"
         @mouseleave="zoomMenu = false">
      <div class="text-center">{{ zoom.toFixed(2) }}</div>
      <div v-if="zoomMenu">
        <v-slider hide-details thumb-label dense v-model="zoom" :max="40" min="0.5" step="0">
          <template v-slot:thumb-label="{ modelValue }">
            {{ modelValue.toFixed(2) }}
          </template>
        </v-slider>
        <div class="zoom-shortcuts">
          <v-btn variant="text" style="font-size: 12px" size="40" density="compact" @click="zoom = 1">1x</v-btn>
          <v-btn variant="text" style="font-size: 12px" size="40" density="compact" @click="zoom = 2">2x</v-btn>
          <v-btn variant="text" style="font-size: 12px" size="40" density="compact" @click="zoom = 10">10x</v-btn>
          <v-btn variant="text" style="font-size: 12px" size="40" density="compact" @click="zoom = 20">20x</v-btn>
          <v-btn variant="text" style="font-size: 12px" size="40" density="compact" @click="zoom = 40">40x</v-btn>
        </div>
      </div>
    </div>

    <div
        :class="['toolbox', 'annotation-toolbox',  !annotationMenu ? 'small' : 'default']"
        @mouseenter="annotationMenu = true"
        @mouseleave="annotationMenu = false">
      <v-menu top :close-on-click="true" offset-y>
        <template v-slot:activator="{ props }">
          <v-btn style="width: 100%" variant="text" v-bind="props">
            <v-avatar :color="selectedLabel.color" class="mr-2" size="26"/>
            {{ selectedLabel.name }}
          </v-btn>
        </template>
        <v-list style="overflow: auto; max-height: 600px">
          <v-list-item
              v-for="(item, index) in props.task.project.labels"
              @click="selectedLabel = item"
              :key="index">
            <template v-slot:prepend>
              <v-avatar size="26" :color="item.color"></v-avatar>
            </template>
            <v-list-item-title>{{ item.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <div v-if="annotationMenu">
        <v-divider/>
        <v-btn variant="text" icon>
          <v-icon>mdi-cursor-default</v-icon>
        </v-btn>
        <v-btn variant="text" icon>
          <v-icon>mdi-vector-polygon</v-icon>
        </v-btn>
        <v-btn variant="text" icon>
          <v-icon>mdi-vector-rectangle</v-icon>
        </v-btn>
        <v-btn variant="text" icon>
          <v-icon>mdi-circle-outline</v-icon>
        </v-btn>
        <v-btn variant="text" icon>
          <v-icon>mdi-ruler</v-icon>
        </v-btn>
      </div>
    </div>
  </v-container>
</template>
<script setup>

import OpenSeadragon from 'openseadragon';
import { nextTick } from 'vue';

const { $axios } = useNuxtApp();

const props = defineProps({
  task: Object
});
let viewer = null;
let noEvents = false;
const annotationMenu = ref(false);
const zoomMenu = ref(true);
const zoom = ref(1);
watch(zoom, (val) => {
  if (viewer == null) return;
  viewer.viewport.zoomTo(val);
});

const selectedLabel = ref({});

onMounted(() => {
  nextTick(() => {
    console.log(props.task);
    viewer = OpenSeadragon({
      id: `seadragon-viewer-${props.task._id}`,
      tileSources: `${$axios.defaults.baseURL}/session/${props.task._id}.dzi`,
      showNavigator: true,
      navigatorPosition: 'TOP_RIGHT',
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
  background-color: #f1f1f1;
  padding: 8px;
  bottom: 16px;
  margin: 0 auto;
}

.zoom-shortcuts {
  display: flex;
  justify-content: center;
}

.navigation-toolbox {
}

.navigation-toolbox.small {
  width: 60px;
  left: calc(50% - 30px);
}

.navigation-toolbox.default {
  width: 200px;
  left: calc(50% - 100px);
}

.annotation-toolbox {
  left: 16px;
}

.annotation-toolbox.small {
  width: 160px;
}

.annotation-toolbox.default {
  width: 200px;
}
</style>