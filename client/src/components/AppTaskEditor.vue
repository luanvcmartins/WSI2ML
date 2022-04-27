<template>
  <div>
    <v-select label="App task" chips
              :items="apps" item-text="name"
              v-model="app"
              return-object/>
    <v-tabs v-model="annotate">
      <v-tab>None</v-tab>
      <v-tab>Geojson</v-tab>
      <v-tab>Triton</v-tab>
    </v-tabs>
    <v-tabs-items v-model="annotate">
      <v-tab-item>Create an empty task to be annotated later on.</v-tab-item>
      <v-tab-item>
        Register annotations from previously generated GeoJSON file.
        <v-form>
          <v-file-input v-for="slide in task.slides"
                        :label="`${slide.name}'s GeoJSON`"
                        :id="`annotation-file-${slide.id}`"
                        @change="loadGeoJSON(slide.id)"
                        persistent-hint
                        :hint="slide.id in annotations ? annotations[slide.id].length + ' annotations loaded.' : 'Select GeoJSON file'"/>
        </v-form>
      </v-tab-item>
      <v-tab-item>
        Annotate from inference server.
        <v-text-field label="Inference server URL" type="uri"/>
      </v-tab-item>
    </v-tabs-items>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn @click="save" outlined>Continue</v-btn>
    </v-card-actions>
  </div>
</template>

<script>
import _ from 'lodash';
import { optimizePath } from '@/SliceDrawer';

export default {
  name: 'AppTaskEditor',
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        this.task = _.cloneDeep(newValue);
      },
    },
  },
  data() {
    return {
      task: {},
      app: null,
      apps: [],
      annotate: 0,
      annotations: {},
    };
  },
  methods: {
    loadGeoJSON(slideId) {
      const annotations = {};
      if (!(slideId in annotations)) {
        annotations[slideId] = [];
      }
      const reader = new FileReader();
      const fileInput = document.getElementById(`annotation-file-${slideId}`);
      reader.readAsText(fileInput.files[0], 'UTF-8');
      reader.onload = (readerEvent) => {
        const json = JSON.parse(readerEvent.target.result);
        annotations[slideId] = json.features.map((feature, idx) => {
          const geo = feature.geometry;
          const { properties } = feature;
          return {
            label_id: properties.label.id,
            title: properties.title,
            geometry: {
              type: 'polygon',
              points: optimizePath(geo.coordinates[0].map((coord) => ({
                x: coord[0],
                y: coord[1],
              }))),
            },
            label: properties.label,
            slide_id: slideId,
          };
        });
      };
      this.annotations = annotations;
    },

    loadApps() {
      this.$get('app/list')
        .then((resp) => {
          this.apps = resp;
        })
        .catch((err) => alert(err));
    },
    save() {
      const appRequest = {
        annotation_id: this.value.id,
        app_id: this.app.id,
        annotations: this.annotations,
      };

      this.$post('task/new_app_task', appRequest)
        .then((resp) => {
          this.$emit('done');
        })
        .catch((err) => alert(err));
    },
  },
  mounted() {
    this.loadApps();
  },
  props: ['value'],
};
</script>

<style scoped>

</style>
