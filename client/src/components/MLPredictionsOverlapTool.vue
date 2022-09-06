<template>
  <v-card>
    <div class="pa-3 pb-0 text-h6 text--primary">ML annotations analysis</div>
    <div class="pl-3 pr-3 text-center font-weight-thin card-description">
      Overlay your annotations with ML-based predictions to improve your models.
    </div>
    <div class="pl-3 pr-3 pb-3" v-if="!usedBefore">
      <input id="ml-file-importer-input" type="file" style="display: none">
      <v-btn block text @click="selectFile">Select .geojson file</v-btn>
    </div>
    <div class="pl-3 pr-3 pb-3" v-else>
      <div class="flex-container">
        <v-slider hide-details class="pl-2 pr-2"
                  style="width: 50%"
                  prepend-icon="mdi-circle-opacity"
                  v-model="drawingStyle.fillOpacity"
                  step="0"
                  thumb-label
                  min="0.0" max="1">
          <template v-slot:thumb-label="{ value }">
            {{ value.toFixed(2) }}
          </template>
        </v-slider>
        <v-slider hide-details class="pl-2 pr-2"
                  style="width: 50%"
                              prepend-icon="mdi-format-line-weight"
                  v-model="drawingStyle.lineWidth"
                  step="1"
                  thumb-label
                  min="0" max="5">
          <template v-slot:thumb-label="{ value }">
            {{ value.toFixed(2) }}
          </template>
        </v-slider>
      </div>
      <v-divider/>
      <v-btn block text @click="clearOverlay">Clear overlay</v-btn>
    </div>
  </v-card>
</template>

<script>

import { loadAnnotations, optimizePath } from '@/SliceDrawer';

export default {
  name: 'MLPredictionsOverlapTool',
  watch: {
    drawingStyle: {
      deep: true,
      handler() {
        this.$emit('style-changed', this.drawingStyle);
      },
    },
  },
  data() {
    return {
      usedBefore: false,
      drawingStyle: {
        fillOpacity: 0.3,
        lineWidth: 1,
        hoverOpacity: 0.3,
      },
    };
  },
  methods: {
    clearOverlay() {
      this.$emit('clear-overlay', null);
      this.usedBefore = false;
    },

    selectFile() {
      const input = document.getElementById('ml-file-importer-input');
      input.onchange = (e) => {
        const reader = new FileReader();
        reader.readAsText(e.target.files[0], 'UTF-8');
        reader.onload = (readerEvent) => {
          const json = JSON.parse(readerEvent.target.result);
          const slideId = this.currentSlide.id;
          const annotations = json.features.map((feature, idx) => {
            const geo = feature.geometry;
            const label = feature.properties.label != null
              ? feature.properties.label
              : {
                color: [0, 0, 0],
                name: 'ML Annotation',
              };
            const description = feature.properties.description != null
              ? feature.properties.description : null;
            return {
              id: `ai-annotation-${idx}`,
              label,
              description,
              geometry: {
                type: 'polygon',
                points: optimizePath(geo.coordinates[0].map((coord) => ({
                  x: coord[0],
                  y: coord[1],
                }))),
              },
              slide_id: slideId,
              layer: 1,
              state: 'overlay',
            };
          });
          this.$emit('annotations', loadAnnotations({ 0: annotations })[0]);
          this.usedBefore = true;
        };
      };
      input.click();
    },
  },
  props: ['currentSlide'],
};
</script>

<style scoped>

.flex-container {
  display: flex;
  flex-wrap: wrap;
}

.card-description {
  font-size: 12px;
}
</style>
